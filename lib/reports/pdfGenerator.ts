import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PLSQLReportExportOptions {
    reportId: string;
    reportName: string;
    description: string;
    paramValue?: string;
    paramLabel?: string;
    data: any[];
}

// Procedure mapping according to db.sql package specification
const REPORT_PROCEDURE_MAP: Record<string, { procedure: string; defaultFilename: string }> = {
    'units-by-camp': {
        procedure: 'LIFELINE_REPORTS_PKG.GET_UNITS_COLLECTED_BY_CAMP',
        defaultFilename: 'LifeLine_Report1_Collection_By_Camp',
    },
    'expiring-inventory': {
        procedure: 'LIFELINE_REPORTS_PKG.GET_EXPIRING_INVENTORY',
        defaultFilename: 'LifeLine_Report2_Expiring_Inventory',
    },
    'donor-history': {
        procedure: 'LIFELINE_REPORTS_PKG.GET_DONOR_HISTORY_REPORT',
        defaultFilename: 'LifeLine_Report3_Donor_History_Eligibility',
    },
    'hospital-fulfillment': {
        procedure: 'LIFELINE_REPORTS_PKG.GET_HOSPITAL_FULFILLMENT_REPORT',
        defaultFilename: 'LifeLine_Report4_Hospital_Fulfillment_Shortages',
    },
    'camp-performance': {
        procedure: 'LIFELINE_REPORTS_PKG.GET_CAMP_PERFORMANCE_REPORT',
        defaultFilename: 'LifeLine_Report5_Camp_Target_Achievement',
    },
};

// Friendly column titles mapping
const COLUMN_LABEL_MAP: Record<string, string> = {
    CAMPNAME: 'Camp Name',
    CITY: 'City / Location',
    BLOODGROUP: 'Blood Group',
    COMPONENTTYPE: 'Component Type',
    TOTALUNITSCOLLECTED: 'Units Collected',
    UNITID: 'Unit ID',
    COLLECTIONDATE: 'Collection Date',
    EXPIRYDATE: 'Expiry Date',
    DAYSREMAINING: 'Days Left',
    STORAGELOCATION: 'Storage Location',
    STATUS: 'Status',
    DONORID: 'Donor ID',
    NAME: 'Donor Name',
    CONTACT: 'Contact',
    CHECKDATE: 'Screening Date',
    WEIGHT: 'Weight (kg)',
    BLOODPRESSURE: 'BP (mmHg)',
    HEMOGLOBIN: 'Hb (g/dL)',
    ELIGIBLE: 'Eligible?',
    DEFERRALREASON: 'Deferral Reason',
    DONATIONID: 'Donation ID',
    DONATIONDATE: 'Donation Date',
    UNITSDONATED: 'Units',
    LOCATIONNAME: 'Donation Center',
    HOSPITALNAME: 'Hospital Name',
    REQUESTID: 'Req ID',
    PRIORITY: 'Priority',
    REQUIREDDATE: 'Required Date',
    UNITSREQUESTED: 'Units Req.',
    UNITSFULFILLED: 'Units Fulfilled',
    SHORTAGE: 'Shortage',
    OVERALLSTATUS: 'Overall Status',
    ORGANIZERNAME: 'Camp Organizer',
    TARGETUNITS: 'Target (Units)',
    UNITSCOLLECTED: 'Actual (Units)',
    ACHIEVEMENTRATEPCT: 'Achievement %',
};

// Columns that should be right-aligned
const RIGHT_ALIGNED_COLUMNS = new Set([
    'TOTALUNITSCOLLECTED',
    'DAYSREMAINING',
    'WEIGHT',
    'HEMOGLOBIN',
    'UNITSDONATED',
    'UNITSREQUESTED',
    'UNITSFULFILLED',
    'SHORTAGE',
    'TARGETUNITS',
    'UNITSCOLLECTED',
    'ACHIEVEMENTRATEPCT',
]);

export function generatePLSQLReportPDF(options: PLSQLReportExportOptions): void {
    const { reportId, reportName, description, paramValue, paramLabel, data } = options;

    const reportMeta = REPORT_PROCEDURE_MAP[reportId] || {
        procedure: 'LIFELINE_REPORTS_PKG.CUSTOM_REPORT',
        defaultFilename: `LifeLine_Report_${reportId}`,
    };

    // Determine orientation: Landscape if more than 6 columns, else Portrait
    const sampleRow = data && data.length > 0 ? data[0] : {};
    const rawKeys = Object.keys(sampleRow);
    const isLandscape = rawKeys.length > 6;

    const doc = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    // Header Banner
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Accent rose line
    doc.setFillColor(225, 29, 72); // Rose 600
    doc.rect(0, 26.5, pageWidth, 2, 'F');

    // Header Branding Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('LIFELINE CONNECT • CENTRAL BLOOD BANK NETWORK', margin, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225); // Slate 300
    doc.text('Enterprise Oracle Database 21c PL/SQL Analytical Business Reports', margin, 18);

    // Official Audit Badge on Top-Right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(253, 164, 175); // Rose 300
    const badgeText = 'OFFICIAL AUDIT EXPORT';
    const badgeWidth = doc.getTextWidth(badgeText);
    doc.text(badgeText, pageWidth - margin - badgeWidth, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // Slate 400
    const sourceText = 'SYS_REFCURSOR Engine';
    const sourceWidth = doc.getTextWidth(sourceText);
    doc.text(sourceText, pageWidth - margin - sourceWidth, 18);

    // Report Title & Metadata Card
    let currentY = 34;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(reportName, margin, currentY);

    currentY += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // Slate 600
    doc.text(description, margin, currentY);

    // Metadata Info Box
    currentY += 5;
    const boxWidth = pageWidth - margin * 2;
    const boxHeight = 15;
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.roundedRect(margin, currentY, boxWidth, boxHeight, 2, 2, 'FD');

    const colWidth = boxWidth / 2;
    const metaY1 = currentY + 5.5;
    const metaY2 = currentY + 11;

    // Col 1: Generation Date & Time
    const now = new Date();
    const formattedDate = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('GENERATED TIME', margin + 6, metaY1);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(formattedDate, margin + 6, metaY2);

    // Col 2: Total Records Extracted
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL RECORDS EXTRACTED', margin + colWidth + 6, metaY1);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(190, 18, 60); // Rose 700
    doc.text(`${data ? data.length : 0} Rows Returned`, margin + colWidth + 6, metaY2);

    currentY += boxHeight + 6;

    // Prepare AutoTable data
    if (!data || data.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text('No records found for the specified query parameters.', margin, currentY + 10);
    } else {
        const headers = rawKeys.map((key) => {
            const normalized = key.toUpperCase();
            return COLUMN_LABEL_MAP[normalized] || key.replace(/_/g, ' ');
        });

        const columnStyles: Record<number, { halign?: 'left' | 'center' | 'right' }> = {};
        rawKeys.forEach((key, index) => {
            const normalized = key.toUpperCase();
            if (RIGHT_ALIGNED_COLUMNS.has(normalized)) {
                columnStyles[index] = { halign: 'right' };
            } else if (['BLOODGROUP', 'STATUS', 'ELIGIBLE', 'PRIORITY', 'OVERALLSTATUS'].includes(normalized)) {
                columnStyles[index] = { halign: 'center' };
            } else {
                columnStyles[index] = { halign: 'left' };
            }
        });

        const rows = data.map((item) =>
            rawKeys.map((key) => {
                const val = item[key];
                if (val === null || val === undefined) return '-';
                if (typeof val === 'number') return String(val);
                // Clean dates if formatted with ISO timestamp
                if (typeof val === 'string' && val.includes('T00:00:00')) {
                    return val.split('T')[0];
                }
                return String(val);
            })
        );

        autoTable(doc, {
            startY: currentY,
            head: [headers],
            body: rows,
            margin: { left: margin, right: margin, bottom: 18 },
            theme: 'striped',
            headStyles: {
                fillColor: [159, 18, 57], // Rose 800
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8,
                cellPadding: 2.8,
            },
            bodyStyles: {
                textColor: [30, 41, 59], // Slate 800
                fontSize: 7.5,
                cellPadding: 2.4,
                lineColor: [241, 245, 249],
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252], // Slate 50
            },
            columnStyles: columnStyles,
            didParseCell: (hookData) => {
                // Formatting specific values
                if (hookData.section === 'body') {
                    const text = hookData.cell.text.join('');
                    if (text === 'CRITICAL') {
                        hookData.cell.styles.textColor = [190, 18, 60]; // Rose 700
                        hookData.cell.styles.fontStyle = 'bold';
                    } else if (text === 'URGENT') {
                        hookData.cell.styles.textColor = [217, 119, 6]; // Amber 600
                        hookData.cell.styles.fontStyle = 'bold';
                    } else if (text === 'AVAILABLE' || text === 'FULFILLED' || text === 'Y' || text === 'COMPLETED') {
                        hookData.cell.styles.textColor = [5, 150, 105]; // Emerald 600
                        hookData.cell.styles.fontStyle = 'bold';
                    } else if (text === 'N' || text === 'DEFERRED') {
                        hookData.cell.styles.textColor = [225, 29, 72]; // Rose 600
                        hookData.cell.styles.fontStyle = 'bold';
                    }
                }
            },
        });
    }

    // Dynamic Multi-Page Footers
    const totalPages = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Footer dividing line
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        // Footer Text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.text(
            'LifeLine Connect Central Blood Bank • Confidential & Proprietary Clinical Audit Record',
            margin,
            pageHeight - 7.5
        );

        const pageStr = `Page ${i} of ${totalPages}`;
        const pageStrWidth = doc.getTextWidth(pageStr);
        doc.text(pageStr, pageWidth - margin - pageStrWidth, pageHeight - 7.5);
    }

    // Save and Trigger Browser Download
    const dateStamp = now.toISOString().slice(0, 10);
    const paramSuffix = paramValue ? `_${paramValue}` : '';
    const filename = `${reportMeta.defaultFilename}${paramSuffix}_${dateStamp}.pdf`;

    doc.save(filename);
}

// Export helper for Hybrid Analytics tables
export function generateHybridAnalyticsPDF(options: {
    title: string;
    subtitle?: string;
    data: any[];
    headers: string[];
    columnKeys: string[];
    filenamePrefix: string;
}): void {
    const { title, subtitle, data, headers, columnKeys, filenamePrefix } = options;

    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    // Header Banner
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Purple accent bar (Hybrid analytics color)
    doc.setFillColor(147, 51, 234); // Purple 600
    doc.rect(0, 26.5, pageWidth, 2, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('LIFELINE CONNECT • HYBRID ANALYTICS ENGINE', margin, 12);



    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(244, 114, 182);
    const badgeText = 'HYBRID CORRELATION AUDIT';
    doc.text(badgeText, pageWidth - margin - doc.getTextWidth(badgeText), 14);

    let currentY = 35;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(title, margin, currentY);

    if (subtitle) {
        currentY += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text(subtitle, margin, currentY);
        currentY += 7;
    } else {
        currentY += 7;
    }

    const rows = data.map((item) =>
        columnKeys.map((key) => {
            const val = item[key];
            return val !== null && val !== undefined ? String(val) : '-';
        })
    );

    autoTable(doc, {
        startY: currentY,
        head: [headers],
        body: rows,
        margin: { left: margin, right: margin, bottom: 18 },
        theme: 'striped',
        headStyles: {
            fillColor: [109, 40, 217], // Purple 700
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8,
            cellPadding: 2.8,
        },
        bodyStyles: {
            textColor: [30, 41, 59],
            fontSize: 7.5,
            cellPadding: 2.4,
        },
        alternateRowStyles: {
            fillColor: [250, 245, 255], // Purple 50
        },
    });

    // Pagination footers
    const totalPages = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text('LifeLine Connect • Dual-Database Hybrid Intelligence Audit Record', margin, pageHeight - 7.5);

        const pageStr = `Page ${i} of ${totalPages}`;
        doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), pageHeight - 7.5);
    }

    const dateStamp = new Date().toISOString().slice(0, 10);
    doc.save(`${filenamePrefix}_${dateStamp}.pdf`);
}
