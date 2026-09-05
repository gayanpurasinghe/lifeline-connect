import { NextResponse } from 'next/server';
import { executeOracleQuery } from '@/lib/db/oracle';
import { connectMongo } from '@/lib/db/mongodb';
import Review from '@/lib/models/Review';
import Appeal from '@/lib/models/Appeal';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Fetch Oracle Camp Performance Metrics
        const oracleCampsSql = `
      SELECT 
        c.CampID,
        c.Name AS CampName,
        v.City,
        c.TargetUnits,
        c.Status AS CampStatus,
        NVL(SUM(dn.UnitsDonated), 0) AS UnitsCollected,
        ROUND((NVL(SUM(dn.UnitsDonated), 0) / NULLIF(c.TargetUnits, 0)) * 100, 1) AS AchievementPct
      FROM CAMP c
      INNER JOIN VENUE v ON c.VenueID = v.VenueID
      LEFT JOIN DONATION dn ON c.CampID = dn.CampID
      GROUP BY c.CampID, c.Name, v.City, c.TargetUnits, c.Status
      ORDER BY c.CampID ASC
    `;

        // 2. Fetch Oracle Available Inventory by Blood Group
        const oracleInventorySql = `
      SELECT 
        BloodGroup,
        COUNT(UnitID) AS AvailableUnits
      FROM BLOOD_UNIT
      WHERE Status = 'AVAILABLE' AND ExpiryDate > SYSDATE
      GROUP BY BloodGroup
    `;

        const [campsOracleResult, inventoryOracleResult] = await Promise.all([
            executeOracleQuery(oracleCampsSql),
            executeOracleQuery(oracleInventorySql),
        ]);

        const oracleCamps = (campsOracleResult.rows as any[]) || [];
        const oracleInventory = (inventoryOracleResult.rows as any[]) || [];

        // Build a quick lookup map for Oracle stock: { 'O+': 5, 'A-': 2, ... }
        const stockMap: Record<string, number> = {};
        for (const item of oracleInventory) {
            stockMap[item.BLOODGROUP] = Number(item.AVAILABLEUNITS);
        }

        // 3. Connect to MongoDB and fetch reviews aggregation + active appeals
        await connectMongo();

        const [mongoReviewStats, mongoAppeals] = await Promise.all([
            Review.aggregate([
                {
                    $group: {
                        _id: '$campId',
                        averageRating: { $avg: '$rating' },
                        totalReviews: { $sum: 1 },
                        averageWaitTime: { $avg: '$waitingTimeMinutes' },
                    },
                },
            ]),
            Appeal.find({ isActive: true }).sort({ createdAt: -1 }).lean(),
        ]);

        const reviewMap: Record<number, { averageRating: number; totalReviews: number; averageWaitTime: number }> = {};
        for (const stat of mongoReviewStats) {
            reviewMap[stat._id] = {
                averageRating: Math.round(stat.averageRating * 10) / 10,
                totalReviews: stat.totalReviews,
                averageWaitTime: Math.round(stat.averageWaitTime),
            };
        }

        // 4. Synthesize Hybrid Dataset 1: Camps Performance (Oracle) + Satisfaction (MongoDB)
        const hybridCampInsights = oracleCamps.map((camp) => {
            const campId = Number(camp.CAMPID);
            const review = reviewMap[campId] || { averageRating: 0, totalReviews: 0, averageWaitTime: 0 };

            let satisfactionTier = 'NO_DATA';
            if (review.totalReviews > 0) {
                if (review.averageRating >= 4.5) satisfactionTier = 'OUTSTANDING';
                else if (review.averageRating >= 3.5) satisfactionTier = 'SATISFACTORY';
                else satisfactionTier = 'NEEDS_IMPROVEMENT';
            }

            return {
                campId,
                campName: camp.CAMPNAME,
                city: camp.CITY,
                targetUnits: camp.TARGETUNITS,
                unitsCollected: camp.UNITSCOLLECTED,
                achievementPct: camp.ACHIEVEMENTPCT || 0,
                campStatus: camp.CAMPSTATUS,
                // MongoDB correlated data
                averageRating: review.averageRating,
                totalReviews: review.totalReviews,
                averageWaitTime: review.averageWaitTime,
                satisfactionTier,
            };
        });

        // 5. Synthesize Hybrid Dataset 2: Emergency Appeals (MongoDB) cross-referenced with Physical Stock (Oracle)
        const hybridAppealMatching = mongoAppeals.map((appeal: any) => {
            const group = appeal.bloodGroup;
            const needed = appeal.unitsNeeded;
            const inStock = stockMap[group] || 0;
            const shortage = Math.max(0, needed - inStock);

            let fulfillmentStatus = 'STOCK_AVAILABLE';
            if (inStock === 0) {
                fulfillmentStatus = 'CRITICAL_DEFICIT';
            } else if (inStock < needed) {
                fulfillmentStatus = 'PARTIAL_STOCK';
            }

            return {
                appealId: appeal._id,
                hospitalName: appeal.hospitalName,
                bloodGroup: group,
                unitsNeeded: needed,
                urgency: appeal.urgency,
                location: appeal.location,
                postedAt: appeal.createdAt,
                responseCount: appeal.comments?.length || 0,
                // Oracle Cross-Database Validation
                oracleCurrentStock: inStock,
                inventoryShortage: shortage,
                fulfillmentStatus,
            };
        });

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            summary: {
                totalCampsMonitored: hybridCampInsights.length,
                totalAppealsEvaluated: hybridAppealMatching.length,
                totalTrackedBloodGroupsInStock: Object.keys(stockMap).length,
            },
            data: {
                campHybridInsights: hybridCampInsights,
                emergencyStockCrossMatch: hybridAppealMatching,
            },
        });
    } catch (error: any) {
        console.error('Hybrid Analytics Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
