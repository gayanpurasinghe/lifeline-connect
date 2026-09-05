-- RELATIONAL TABLES WITH CONSTRAINTS

-- 1. VENUE
CREATE TABLE VENUE (
    VenueID         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Name            VARCHAR2(100) NOT NULL,
    Address         VARCHAR2(255) NOT NULL,
    City            VARCHAR2(50)  NOT NULL,
    Capacity        NUMBER(6)     CHECK (Capacity > 0),
    Contact         VARCHAR2(20)  NOT NULL
);

-- 2. STAFF
CREATE TABLE STAFF (
    StaffID         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Name            VARCHAR2(100) NOT NULL,
    Role            VARCHAR2(50)  NOT NULL,
    Contact         VARCHAR2(20)  NOT NULL,
    Email           VARCHAR2(100) UNIQUE NOT NULL,
    Status          VARCHAR2(20)  DEFAULT 'ACTIVE' CHECK (Status IN ('ACTIVE', 'INACTIVE', 'ON_LEAVE'))
);

-- 3. VOLUNTEER
CREATE TABLE VOLUNTEER (
    VolunteerID     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Name            VARCHAR2(100) NOT NULL,
    Contact         VARCHAR2(20)  NOT NULL,
    Email           VARCHAR2(100) UNIQUE,
    Skills          VARCHAR2(200),
    Status          VARCHAR2(20)  DEFAULT 'ACTIVE' CHECK (Status IN ('ACTIVE', 'INACTIVE'))
);

-- 4. CAMP
CREATE TABLE CAMP (
    CampID          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Name            VARCHAR2(150) NOT NULL,
    VenueID         NUMBER        NOT NULL,
    StartDate       DATE          NOT NULL,
    EndDate         DATE          NOT NULL,
    TargetUnits     NUMBER(6)     DEFAULT 50 CHECK (TargetUnits > 0),
    Status          VARCHAR2(20)  DEFAULT 'PLANNED' CHECK (Status IN ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    OrganizerID     NUMBER        NOT NULL,
    CONSTRAINT FK_CAMP_VENUE FOREIGN KEY (VenueID) REFERENCES VENUE(VenueID),
    CONSTRAINT FK_CAMP_STAFF FOREIGN KEY (OrganizerID) REFERENCES STAFF(StaffID),
    CONSTRAINT CHK_CAMP_DATES CHECK (EndDate >= StartDate)
);

-- 5. CAMP_STAFF (Junction Table)
CREATE TABLE CAMP_STAFF (
    AssignmentID    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    CampID          NUMBER        NOT NULL,
    StaffID         NUMBER        NOT NULL,
    Role            VARCHAR2(50)  NOT NULL,
    AssignedDate    DATE          DEFAULT SYSDATE,
    CONSTRAINT FK_CS_CAMP  FOREIGN KEY (CampID) REFERENCES CAMP(CampID) ON DELETE CASCADE,
    CONSTRAINT FK_CS_STAFF FOREIGN KEY (StaffID) REFERENCES STAFF(StaffID),
    CONSTRAINT UQ_CAMP_STAFF UNIQUE (CampID, StaffID)
);

-- 6. CAMP_VOLUNTEER (Junction Table)
CREATE TABLE CAMP_VOLUNTEER (
    AssignmentID    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    CampID          NUMBER        NOT NULL,
    VolunteerID     NUMBER        NOT NULL,
    Role            VARCHAR2(50)  NOT NULL,
    AssignedDate    DATE          DEFAULT SYSDATE,
    CONSTRAINT FK_CV_CAMP FOREIGN KEY (CampID) REFERENCES CAMP(CampID) ON DELETE CASCADE,
    CONSTRAINT FK_CV_VOL  FOREIGN KEY (VolunteerID) REFERENCES VOLUNTEER(VolunteerID),
    CONSTRAINT UQ_CAMP_VOLUNTEER UNIQUE (CampID, VolunteerID)
);

-- 7. DONOR
CREATE TABLE DONOR (
    DonorID          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Name             VARCHAR2(100) NOT NULL,
    DOB              DATE          NOT NULL,
    BloodGroup       VARCHAR2(5)   NOT NULL,
    Contact          VARCHAR2(20)  NOT NULL,
    Email            VARCHAR2(100) UNIQUE NOT NULL,
    Address          VARCHAR2(255),
    RegistrationDate DATE          DEFAULT SYSDATE,
    Status           VARCHAR2(20)  DEFAULT 'ACTIVE' CHECK (Status IN ('ACTIVE', 'DEFERRED', 'INACTIVE')),
    CONSTRAINT CHK_DONOR_BG CHECK (BloodGroup IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'))
);

-- 8. DONOR_HEALTH
CREATE TABLE DONOR_HEALTH (
    HealthID        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    DonorID         NUMBER        NOT NULL,
    CheckDate       DATE          DEFAULT SYSDATE,
    Weight          NUMBER(5,2)   NOT NULL CHECK (Weight >= 30),
    BloodPressure   VARCHAR2(15)  NOT NULL,
    Hemoglobin      NUMBER(4,2)   NOT NULL CHECK (Hemoglobin > 0),
    Eligible        CHAR(1)       DEFAULT 'Y' CHECK (Eligible IN ('Y', 'N')),
    DeferralReason  VARCHAR2(255),
    CheckedBy       NUMBER        NOT NULL,
    CONSTRAINT FK_DH_DONOR FOREIGN KEY (DonorID) REFERENCES DONOR(DonorID) ON DELETE CASCADE,
    CONSTRAINT FK_DH_STAFF FOREIGN KEY (CheckedBy) REFERENCES STAFF(StaffID)
);

-- 9. DONATION
CREATE TABLE DONATION (
    DonationID      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    DonorID         NUMBER        NOT NULL,
    HealthID        NUMBER        NOT NULL,
    CampID          NUMBER,       -- NULL represents central blood bank walk-in
    DonationDate    DATE          DEFAULT SYSDATE,
    UnitsDonated    NUMBER(3)     DEFAULT 1 CHECK (UnitsDonated > 0),
    Status          VARCHAR2(20)  DEFAULT 'COMPLETED' CHECK (Status IN ('COMPLETED', 'DISCARDED', 'REJECTED')),
    CONSTRAINT FK_DON_DONOR  FOREIGN KEY (DonorID) REFERENCES DONOR(DonorID),
    CONSTRAINT FK_DON_HEALTH FOREIGN KEY (HealthID) REFERENCES DONOR_HEALTH(HealthID),
    CONSTRAINT FK_DON_CAMP   FOREIGN KEY (CampID) REFERENCES CAMP(CampID)
);

-- 10. BLOOD_UNIT
CREATE TABLE BLOOD_UNIT (
    UnitID          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    DonationID      NUMBER        NOT NULL,
    BloodGroup      VARCHAR2(5)   NOT NULL,
    ComponentType   VARCHAR2(30)  DEFAULT 'WHOLE_BLOOD' 
                    CHECK (ComponentType IN ('WHOLE_BLOOD', 'RED_CELLS', 'PLATELETS', 'PLASMA')),
    CollectionDate  DATE          DEFAULT SYSDATE,
    ExpiryDate      DATE          NOT NULL,
    Volume_ml       NUMBER(5)     DEFAULT 450 CHECK (Volume_ml > 0),
    Status          VARCHAR2(20)  DEFAULT 'AVAILABLE' 
                    CHECK (Status IN ('AVAILABLE', 'RESERVED', 'DISTRIBUTED', 'EXPIRED', 'DISCARDED')),
    StorageLocation VARCHAR2(50)  NOT NULL,
    CONSTRAINT FK_BU_DONATION FOREIGN KEY (DonationID) REFERENCES DONATION(DonationID),
    CONSTRAINT CHK_BU_BG CHECK (BloodGroup IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'))
);

-- 11. HOSPITAL
CREATE TABLE HOSPITAL (
    HospitalID      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Name            VARCHAR2(150) NOT NULL,
    Location        VARCHAR2(100) NOT NULL,
    Contact         VARCHAR2(20)  NOT NULL,
    Email           VARCHAR2(100) UNIQUE NOT NULL
);

-- 12. BLOOD_REQUEST
CREATE TABLE BLOOD_REQUEST (
    RequestID       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    HospitalID      NUMBER        NOT NULL,
    RequestDate     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    RequiredDate    DATE          NOT NULL,
    Priority        VARCHAR2(20)  DEFAULT 'NORMAL' CHECK (Priority IN ('CRITICAL', 'URGENT', 'NORMAL')),
    Status          VARCHAR2(20)  DEFAULT 'PENDING' CHECK (Status IN ('PENDING', 'PARTIAL', 'FULFILLED', 'REJECTED')),
    RequestedBy     VARCHAR2(100) NOT NULL,
    CONSTRAINT FK_BR_HOSPITAL FOREIGN KEY (HospitalID) REFERENCES HOSPITAL(HospitalID)
);

-- 13. REQUEST_ITEM
CREATE TABLE REQUEST_ITEM (
    RequestItemID   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    RequestID       NUMBER        NOT NULL,
    BloodGroup      VARCHAR2(5)   NOT NULL,
    ComponentType   VARCHAR2(30)  DEFAULT 'WHOLE_BLOOD' 
                    CHECK (ComponentType IN ('WHOLE_BLOOD', 'RED_CELLS', 'PLATELETS', 'PLASMA')),
    UnitsRequested  NUMBER(4)     NOT NULL CHECK (UnitsRequested > 0),
    UnitsFulfilled  NUMBER(4)     DEFAULT 0 CHECK (UnitsFulfilled >= 0),
    CONSTRAINT FK_RI_REQUEST FOREIGN KEY (RequestID) REFERENCES BLOOD_REQUEST(RequestID) ON DELETE CASCADE,
    CONSTRAINT CHK_RI_BG CHECK (BloodGroup IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    CONSTRAINT CHK_FULFILLMENT CHECK (UnitsFulfilled <= UnitsRequested)
);

-- 14. DISTRIBUTION
CREATE TABLE DISTRIBUTION (
    DistributionID   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    RequestItemID    NUMBER        NOT NULL,
    UnitID           NUMBER        UNIQUE NOT NULL, -- Blood unit can only be distributed once
    StaffID          NUMBER        NOT NULL,
    DistributionDate TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    Notes            VARCHAR2(255),
    CONSTRAINT FK_DIST_ITEM  FOREIGN KEY (RequestItemID) REFERENCES REQUEST_ITEM(RequestItemID),
    CONSTRAINT FK_DIST_UNIT  FOREIGN KEY (UnitID) REFERENCES BLOOD_UNIT(UnitID),
    CONSTRAINT FK_DIST_STAFF FOREIGN KEY (StaffID) REFERENCES STAFF(StaffID)
);


-- DATABASE TRIGGERS


-- Trigger 1: Auto-calculate ExpiryDate based on ComponentType
CREATE OR REPLACE TRIGGER TRG_SET_UNIT_EXPIRY
BEFORE INSERT ON BLOOD_UNIT
FOR EACH ROW
BEGIN
    IF :NEW.ExpiryDate IS NULL THEN
        CASE :NEW.ComponentType
            WHEN 'PLATELETS'   THEN :NEW.ExpiryDate := :NEW.CollectionDate + 5;
            WHEN 'RED_CELLS'   THEN :NEW.ExpiryDate := :NEW.CollectionDate + 42;
            WHEN 'PLASMA'      THEN :NEW.ExpiryDate := :NEW.CollectionDate + 365;
            ELSE                    :NEW.ExpiryDate := :NEW.CollectionDate + 35; -- WHOLE_BLOOD
        END CASE;
    END IF;
END;
/

-- Trigger 2: Update Blood Unit Status and Requisition Count on Distribution
CREATE OR REPLACE TRIGGER TRG_AFTER_DISTRIBUTION
AFTER INSERT ON DISTRIBUTION
FOR EACH ROW
DECLARE
    v_req_id NUMBER;
    v_total_requested NUMBER;
    v_total_fulfilled NUMBER;
BEGIN
    -- 1. Mark the physical blood unit as DISTRIBUTED
    UPDATE BLOOD_UNIT
    SET Status = 'DISTRIBUTED'
    WHERE UnitID = :NEW.UnitID;

    -- 2. Increment fulfilled units in the line item
    UPDATE REQUEST_ITEM
    SET UnitsFulfilled = UnitsFulfilled + 1
    WHERE RequestItemID = :NEW.RequestItemID
    RETURNING RequestID INTO v_req_id;

    -- 3. Check overall Request completion status
    SELECT SUM(UnitsRequested), SUM(UnitsFulfilled)
    INTO v_total_requested, v_total_fulfilled
    FROM REQUEST_ITEM
    WHERE RequestID = v_req_id;

    IF v_total_fulfilled >= v_total_requested THEN
        UPDATE BLOOD_REQUEST SET Status = 'FULFILLED' WHERE RequestID = v_req_id;
    ELSIF v_total_fulfilled > 0 THEN
        UPDATE BLOOD_REQUEST SET Status = 'PARTIAL' WHERE RequestID = v_req_id;
    END IF;
END;
/

-- Trigger 3: Prevent Donating Blood if Health Check Failed
CREATE OR REPLACE TRIGGER TRG_CHECK_ELIGIBILITY
BEFORE INSERT ON DONATION
FOR EACH ROW
DECLARE
    v_eligible CHAR(1);
BEGIN
    SELECT Eligible INTO v_eligible
    FROM DONOR_HEALTH
    WHERE HealthID = :NEW.HealthID;

    IF v_eligible != 'Y' THEN
        RAISE_APPLICATION_ERROR(-20001, 'Donor health check marked as ineligible. Donation rejected.');
    END IF;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20002, 'Associated health check record not found.');
END;
/

-- Trigger 4: Autonomous Clinical Eligibility Evaluation
CREATE OR REPLACE TRIGGER TRG_EVALUATE_DONOR_HEALTH
BEFORE INSERT OR UPDATE ON DONOR_HEALTH
FOR EACH ROW
BEGIN
    -- Rule 1: Donor body weight must be >= 50.0 kg
    IF :NEW.Weight < 50.0 THEN
        :NEW.Eligible := 'N';
        :NEW.DeferralReason := 'Underweight: Body weight (' || :NEW.Weight || ' kg) below clinical minimum 50 kg';
    -- Rule 2: Minimum hemoglobin must be >= 12.5 g/dL
    ELSIF :NEW.Hemoglobin < 12.5 THEN
        :NEW.Eligible := 'N';
        :NEW.DeferralReason := 'Low Hemoglobin: Measured ' || :NEW.Hemoglobin || ' g/dL (minimum 12.5 g/dL required)';
    ELSE
        :NEW.Eligible := 'Y';
        :NEW.DeferralReason := NULL;
    END IF;
END;
/


-- PL/SQL PACKAGE FOR 5 BUSINESS REPORTS

CREATE OR REPLACE PACKAGE LIFELINE_REPORTS_PKG AS
    TYPE t_cursor IS REF CURSOR;

    -- Report 1: Total blood units collected across donation camps by group
    PROCEDURE GET_UNITS_COLLECTED_BY_CAMP (
        p_cursor OUT t_cursor
    );

    -- Report 2: Current inventory levels and expiring units within N days
    PROCEDURE GET_EXPIRING_INVENTORY (
        p_days_ahead IN NUMBER,
        p_cursor     OUT t_cursor
    );

    -- Report 3: Individual donor eligibility and comprehensive history
    PROCEDURE GET_DONOR_HISTORY_REPORT (
        p_donor_id IN NUMBER,
        p_cursor   OUT t_cursor
    );

    -- Report 4: Hospital requisition fulfillment and shortage analytics
    PROCEDURE GET_HOSPITAL_FULFILLMENT_REPORT (
        p_cursor OUT t_cursor
    );

    -- Report 5: Camp target achievement and performance breakdown
    PROCEDURE GET_CAMP_PERFORMANCE_REPORT (
        p_cursor OUT t_cursor
    );
END LIFELINE_REPORTS_PKG;
/

CREATE OR REPLACE PACKAGE BODY LIFELINE_REPORTS_PKG AS

    -- Report 1 
    PROCEDURE GET_UNITS_COLLECTED_BY_CAMP (
        p_cursor OUT t_cursor
    ) IS
    BEGIN
        OPEN p_cursor FOR
            SELECT 
                NVL(c.Name, 'Walk-in Blood Bank') AS CampName,
                v.City,
                bu.BloodGroup,
                bu.ComponentType,
                COUNT(bu.UnitID) AS TotalUnitsCollected
            FROM DONATION d
            LEFT JOIN CAMP c ON d.CampID = c.CampID
            LEFT JOIN VENUE v ON c.VenueID = v.VenueID
            INNER JOIN BLOOD_UNIT bu ON d.DonationID = bu.DonationID
            GROUP BY NVL(c.Name, 'Walk-in Blood Bank'), v.City, bu.BloodGroup, bu.ComponentType
            ORDER BY CampName, bu.BloodGroup;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20101, 'Error generating units collected report: ' || SQLERRM);
    END GET_UNITS_COLLECTED_BY_CAMP;

    -- Report 2 
    PROCEDURE GET_EXPIRING_INVENTORY (
        p_days_ahead IN NUMBER,
        p_cursor     OUT t_cursor
    ) IS
    BEGIN
        OPEN p_cursor FOR
            SELECT 
                UnitID,
                BloodGroup,
                ComponentType,
                CollectionDate,
                ExpiryDate,
                ROUND(ExpiryDate - SYSDATE, 1) AS DaysRemaining,
                StorageLocation,
                Status
            FROM BLOOD_UNIT
            WHERE Status = 'AVAILABLE'
              AND ExpiryDate <= (SYSDATE + NVL(p_days_ahead, 7))
            ORDER BY ExpiryDate ASC;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20102, 'Error generating expiring inventory report: ' || SQLERRM);
    END GET_EXPIRING_INVENTORY;

    -- Report 3 
    PROCEDURE GET_DONOR_HISTORY_REPORT (
        p_donor_id IN NUMBER,
        p_cursor   OUT t_cursor
    ) IS
    BEGIN
        OPEN p_cursor FOR
            SELECT 
                d.DonorID,
                d.Name,
                d.BloodGroup,
                d.Contact,
                dh.CheckDate,
                dh.Weight,
                dh.BloodPressure,
                dh.Hemoglobin,
                dh.Eligible,
                dh.DeferralReason,
                dn.DonationID,
                dn.DonationDate,
                dn.UnitsDonated,
                NVL(c.Name, 'Blood Bank Center') AS LocationName
            FROM DONOR d
            LEFT JOIN DONOR_HEALTH dh ON d.DonorID = dh.DonorID
            LEFT JOIN DONATION dn ON dh.HealthID = dn.HealthID
            LEFT JOIN CAMP c ON dn.CampID = c.CampID
            WHERE d.DonorID = p_donor_id
            ORDER BY dh.CheckDate DESC;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20103, 'Error generating donor history report: ' || SQLERRM);
    END GET_DONOR_HISTORY_REPORT;

    -- Report 4 
    PROCEDURE GET_HOSPITAL_FULFILLMENT_REPORT (
        p_cursor OUT t_cursor
    ) IS
    BEGIN
        OPEN p_cursor FOR
            SELECT 
                h.Name AS HospitalName,
                br.RequestID,
                br.Priority,
                br.RequiredDate,
                ri.BloodGroup,
                ri.ComponentType,
                ri.UnitsRequested,
                ri.UnitsFulfilled,
                (ri.UnitsRequested - ri.UnitsFulfilled) AS Shortage,
                br.Status AS OverallStatus
            FROM BLOOD_REQUEST br
            INNER JOIN HOSPITAL h ON br.HospitalID = h.HospitalID
            INNER JOIN REQUEST_ITEM ri ON br.RequestID = ri.RequestID
            ORDER BY 
                CASE br.Priority 
                    WHEN 'CRITICAL' THEN 1 
                    WHEN 'URGENT' THEN 2 
                    ELSE 3 
                END, 
                br.RequiredDate ASC;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20104, 'Error generating hospital requisition report: ' || SQLERRM);
    END GET_HOSPITAL_FULFILLMENT_REPORT;

    -- Report 5 
    PROCEDURE GET_CAMP_PERFORMANCE_REPORT (
        p_cursor OUT t_cursor
    ) IS
    BEGIN
        OPEN p_cursor FOR
            SELECT 
                c.CampID,
                c.Name AS CampName,
                v.City,
                s.Name AS OrganizerName,
                c.TargetUnits,
                NVL(SUM(dn.UnitsDonated), 0) AS UnitsCollected,
                ROUND((NVL(SUM(dn.UnitsDonated), 0) / NULLIF(c.TargetUnits, 0)) * 100, 2) AS AchievementRatePct,
                c.Status
            FROM CAMP c
            INNER JOIN VENUE v ON c.VenueID = v.VenueID
            INNER JOIN STAFF s ON c.OrganizerID = s.StaffID
            LEFT JOIN DONATION dn ON c.CampID = dn.CampID
            GROUP BY c.CampID, c.Name, v.City, s.Name, c.TargetUnits, c.Status
            ORDER BY c.CampID;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20105, 'Error generating camp performance report: ' || SQLERRM);
    END GET_CAMP_PERFORMANCE_REPORT;

END LIFELINE_REPORTS_PKG;
/
COMMIT;
----------------------------------------------------------------
-- INSERT SAMPLE DATA
----------------------------------------------------------------

-- Insert Venues
INSERT INTO VENUE (Name, Address, City, Capacity, Contact) 
VALUES ('Town Hall Community Center', '120 Galle Road', 'Colombo', 250, '+94112345678');
INSERT INTO VENUE (Name, Address, City, Capacity, Contact) 
VALUES ('Youth Council Auditorium', '45 Kandy Road', 'Kandy', 180, '+94812345678');
INSERT INTO VENUE (Name, Address, City, Capacity, Contact) 
VALUES ('Southern Sports Complex', '12 Matara Road', 'Galle', 300, '+94912345678');

-- Insert Staff
INSERT INTO STAFF (Name, Role, Contact, Email, Status) 
VALUES ('Dr. Nihal Senaratne', 'Medical Officer', '+94771112233', 'nihal@lifeline.lk', 'ACTIVE');
INSERT INTO STAFF (Name, Role, Contact, Email, Status) 
VALUES ('Sister Malkanthi Perera', 'Head Phlebotomist', '+94772223344', 'malkanthi@lifeline.lk', 'ACTIVE');
INSERT INTO STAFF (Name, Role, Contact, Email, Status) 
VALUES ('Kavinda Jayasuriya', 'Inventory Manager', '+94773334455', 'kavinda@lifeline.lk', 'ACTIVE');

-- Insert Volunteers
INSERT INTO VOLUNTEER (Name, Contact, Email, Skills, Status) 
VALUES ('Chamath Fernando', '+94715556677', 'chamath@gmail.com', 'Donor Registration, First Aid', 'ACTIVE');
INSERT INTO VOLUNTEER (Name, Contact, Email, Skills, Status) 
VALUES ('Dinuka Silva', '+94716667788', 'dinuka@gmail.com', 'Crowd Management, Logistics', 'ACTIVE');

-- Insert Camps
INSERT INTO CAMP (Name, VenueID, StartDate, EndDate, TargetUnits, Status, OrganizerID) 
VALUES ('Rotary Club Youth Drive', 1, SYSDATE - 10, SYSDATE - 9, 60, 'COMPLETED', 1);
INSERT INTO CAMP (Name, VenueID, StartDate, EndDate, TargetUnits, Status, OrganizerID) 
VALUES ('Kandy Central Blood Drive', 2, SYSDATE - 2, SYSDATE - 1, 40, 'ACTIVE', 1);
INSERT INTO CAMP (Name, VenueID, StartDate, EndDate, TargetUnits, Status, OrganizerID) 
VALUES ('Southern Coastal Blood Camp', 3, SYSDATE + 7, SYSDATE + 8, 80, 'PLANNED', 3);

-- Link Staff & Volunteers to Camps
INSERT INTO CAMP_STAFF (CampID, StaffID, Role) VALUES (1, 1, 'Medical Supervisor');
INSERT INTO CAMP_STAFF (CampID, StaffID, Role) VALUES (1, 2, 'Lead Phlebotomist');
INSERT INTO CAMP_STAFF (CampID, StaffID, Role) VALUES (2, 2, 'Phlebotomist');

INSERT INTO CAMP_VOLUNTEER (CampID, VolunteerID, Role) VALUES (1, 1, 'Reception Desk');
INSERT INTO CAMP_VOLUNTEER (CampID, VolunteerID, Role) VALUES (2, 2, 'Refreshment Logistics');

-- Insert Donors
INSERT INTO DONOR (Name, DOB, BloodGroup, Contact, Email, Address, RegistrationDate, Status) 
VALUES ('Saman Kumara', TO_DATE('1995-04-12', 'YYYY-MM-DD'), 'O+', '+94701234567', 'saman@mail.com', 'Nugegoda', SYSDATE - 120, 'ACTIVE');
INSERT INTO DONOR (Name, DOB, BloodGroup, Contact, Email, Address, RegistrationDate, Status) 
VALUES ('Anura Bandara', TO_DATE('1998-08-23', 'YYYY-MM-DD'), 'A-', '+94702345678', 'anura@mail.com', 'Peradeniya', SYSDATE - 90, 'ACTIVE');
INSERT INTO DONOR (Name, DOB, BloodGroup, Contact, Email, Address, RegistrationDate, Status) 
VALUES ('Dilani Wickramasinghe', TO_DATE('2001-11-05', 'YYYY-MM-DD'), 'B+', '+94703456789', 'dilani@mail.com', 'Matara', SYSDATE - 60, 'ACTIVE');
INSERT INTO DONOR (Name, DOB, BloodGroup, Contact, Email, Address, RegistrationDate, Status) 
VALUES ('Roshan Alwis', TO_DATE('1990-02-18', 'YYYY-MM-DD'), 'AB+', '+94704567890', 'roshan@mail.com', 'Colombo 03', SYSDATE - 30, 'ACTIVE');

-- Insert Health Checks
-- Saman (Eligible)
INSERT INTO DONOR_HEALTH (DonorID, CheckDate, Weight, BloodPressure, Hemoglobin, Eligible, DeferralReason, CheckedBy) 
VALUES (1, SYSDATE - 10, 68.5, '120/80', 14.2, 'Y', NULL, 1);
-- Anura (Eligible)
INSERT INTO DONOR_HEALTH (DonorID, CheckDate, Weight, BloodPressure, Hemoglobin, Eligible, DeferralReason, CheckedBy) 
VALUES (2, SYSDATE - 2, 74.0, '125/82', 13.8, 'Y', NULL, 1);
-- Dilani (Deferred - Low Hemoglobin)
INSERT INTO DONOR_HEALTH (DonorID, CheckDate, Weight, BloodPressure, Hemoglobin, Eligible, DeferralReason, CheckedBy) 
VALUES (3, SYSDATE - 2, 48.0, '110/70', 11.2, 'N', 'Low Hemoglobin (<12.5 g/dL)', 1);
-- Roshan (Eligible)
INSERT INTO DONOR_HEALTH (DonorID, CheckDate, Weight, BloodPressure, Hemoglobin, Eligible, DeferralReason, CheckedBy) 
VALUES (4, SYSDATE - 1, 82.0, '130/85', 15.0, 'Y', NULL, 1);

-- Insert Donations (Trigger TRG_CHECK_ELIGIBILITY verifies eligibility)
INSERT INTO DONATION (DonorID, HealthID, CampID, DonationDate, UnitsDonated, Status) 
VALUES (1, 1, 1, SYSDATE - 10, 1, 'COMPLETED');
INSERT INTO DONATION (DonorID, HealthID, CampID, DonationDate, UnitsDonated, Status) 
VALUES (2, 2, 2, SYSDATE - 2, 1, 'COMPLETED');
INSERT INTO DONATION (DonorID, HealthID, CampID, DonationDate, UnitsDonated, Status) 
VALUES (4, 4, 2, SYSDATE - 1, 1, 'COMPLETED');

-- Insert Blood Units (Trigger TRG_SET_UNIT_EXPIRY computes ExpiryDate automatically)
INSERT INTO BLOOD_UNIT (DonationID, BloodGroup, ComponentType, CollectionDate, ExpiryDate, Volume_ml, Status, StorageLocation) 
VALUES (1, 'O+', 'WHOLE_BLOOD', SYSDATE - 10, NULL, 450, 'AVAILABLE', 'FRIDGE-A-SHELF-1');
INSERT INTO BLOOD_UNIT (DonationID, BloodGroup, ComponentType, CollectionDate, ExpiryDate, Volume_ml, Status, StorageLocation) 
VALUES (1, 'O+', 'PLATELETS', SYSDATE - 2, NULL, 250, 'AVAILABLE', 'AGITATOR-01'); -- Short expiry demo
INSERT INTO BLOOD_UNIT (DonationID, BloodGroup, ComponentType, CollectionDate, ExpiryDate, Volume_ml, Status, StorageLocation) 
VALUES (2, 'A-', 'RED_CELLS', SYSDATE - 2, NULL, 300, 'AVAILABLE', 'FRIDGE-B-SHELF-2');
INSERT INTO BLOOD_UNIT (DonationID, BloodGroup, ComponentType, CollectionDate, ExpiryDate, Volume_ml, Status, StorageLocation) 
VALUES (3, 'AB+', 'WHOLE_BLOOD', SYSDATE - 1, NULL, 450, 'AVAILABLE', 'FRIDGE-A-SHELF-3');

-- Insert Hospitals
INSERT INTO HOSPITAL (Name, Location, Contact, Email) 
VALUES ('National Hospital Sri Lanka', 'Colombo 10', '+94112691111', 'bloodbank@nhsl.health.lk');
INSERT INTO HOSPITAL (Name, Location, Contact, Email) 
VALUES ('Teaching Hospital Karapitiya', 'Galle', '+94912232250', 'karapitiya.store@health.lk');

-- Insert Hospital Requests
INSERT INTO BLOOD_REQUEST (HospitalID, RequestDate, RequiredDate, Priority, Status, RequestedBy) 
VALUES (1, CURRENT_TIMESTAMP, SYSDATE + 2, 'CRITICAL', 'PENDING', 'Dr. Senaka');
INSERT INTO BLOOD_REQUEST (HospitalID, RequestDate, RequiredDate, Priority, Status, RequestedBy) 
VALUES (2, CURRENT_TIMESTAMP, SYSDATE + 5, 'NORMAL', 'PENDING', 'Dr. Priyantha');

-- Insert Requisition Items
INSERT INTO REQUEST_ITEM (RequestID, BloodGroup, ComponentType, UnitsRequested, UnitsFulfilled) 
VALUES (1, 'O+', 'WHOLE_BLOOD', 2, 0);
INSERT INTO REQUEST_ITEM (RequestID, BloodGroup, ComponentType, UnitsRequested, UnitsFulfilled) 
VALUES (1, 'A-', 'RED_CELLS', 1, 0);
INSERT INTO REQUEST_ITEM (RequestID, BloodGroup, ComponentType, UnitsRequested, UnitsFulfilled) 
VALUES (2, 'AB+', 'WHOLE_BLOOD', 1, 0);

-- Distribute 1 Unit (Trigger TRG_AFTER_DISTRIBUTION updates inventory and request progress)
INSERT INTO DISTRIBUTION (RequestItemID, UnitID, StaffID, DistributionDate, Notes) 
VALUES (1, 1, 3, CURRENT_TIMESTAMP, 'Dispatched via emergency ambulance');
