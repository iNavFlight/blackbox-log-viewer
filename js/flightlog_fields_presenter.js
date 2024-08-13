"use strict";

function FlightLogFieldPresenter() {
}

(function () {
    var FRIENDLY_FIELD_NAMES = {
        'axisP[all]': 'PID_P',
        'axisP[0]': 'PID_P[roll]',
        'axisP[1]': 'PID_P[pitch]',
        'axisP[2]': 'PID_P[yaw]',
        'axisI[all]': 'PID_I',
        'axisI[0]': 'PID_I[roll]',
        'axisI[1]': 'PID_I[pitch]',
        'axisI[2]': 'PID_I[yaw]',
        'axisD[all]': 'PID_D',
        'axisD[0]': 'PID_D[roll]',
        'axisD[1]': 'PID_D[pitch]',
        'axisD[2]': 'PID_D[yaw]',
        'axisF[all]': 'PID_F',
        'axisF[0]': 'PID_F[roll]',
        'axisF[1]': 'PID_F[pitch]',
        'axisF[2]': 'PID_F[yaw]',

        'rcCommand[all]': 'rcCommand',
        'rcCommand[0]': 'rcCommand[roll]',
        'rcCommand[1]': 'rcCommand[pitch]',
        'rcCommand[2]': 'rcCommand[yaw]',
        'rcCommand[3]': 'rcCommand[throttle]',

        'axisRate[all]': 'setpointRate[all]',
        'axisRate[0]': 'setpointRate[roll]',
        'axisRate[1]': 'setpointRate[pitch]',
        'axisRate[2]': 'setpointRate[yaw]',

        'gyroADC[all]': 'gyro',
        'gyroADC[0]': 'gyro[roll]',
        'gyroADC[1]': 'gyro[pitch]',
        'gyroADC[2]': 'gyro[yaw]',

        'gyroRaw[all]': 'gyroRAW',
        'gyroRaw[0]': 'gyroRAW[roll]',
        'gyroRaw[1]': 'gyroRAW[pitch]',
        'gyroRaw[2]': 'gyroRAW[yaw]',

        'accSmooth[all]': 'acc',
        'accSmooth[0]': 'acc[X]',
        'accSmooth[1]': 'acc[Y]',
        'accSmooth[2]': 'acc[Z]',

        'magADC[all]': 'mag',
        'magADC[0]': 'mag[X]',
        'magADC[1]': 'mag[Y]',
        'magADC[2]': 'mag[Z]',

        'vbatLatest': 'vbat',
        'BaroAlt': 'baro',

        'servo[all]': 'servos',

        'heading[all]': 'heading',
        'heading[0]': 'heading[roll]',
        'heading[1]': 'heading[pitch]',
        'heading[2]': 'heading[yaw]',

        //End-users prefer 1-based indexing
        'motor[all]': 'motors',
        'motor[0]': 'motor[1]', 'motor[1]': 'motor[2]', 'motor[2]': 'motor[3]', 'motor[3]': 'motor[4]',
        'motor[4]': 'motor[5]', 'motor[5]': 'motor[6]', 'motor[6]': 'motor[7]', 'motor[7]': 'motor[8]',

        //Virtual fields
        'axisSum[all]': 'PID_sum',
        'axisSum[0]': 'PID_sum[roll]',
        'axisSum[1]': 'PID_sum[pitch]',
        'axisSum[2]': 'PID_sum[yaw]',

        //Virtual fields - Add the Error fields
        'axisError[all]': 'PID_Error',
        'axisError[0]': 'PID_Error[roll]',
        'axisError[1]': 'PID_Error[pitch]',
        'axisError[2]': 'PID_Error[yaw]',
    };

    var DEBUG_FRIENDLY_FIELD_NAMES = {
        0: {       //Debug none
            'debug[all]': 'debug[all]',
            'debug[0]': 'debug[0]',
            'debug[1]': 'debug[1]',
            'debug[2]': 'debug[2]',
            'debug[3]': 'debug[3]',
            'debug[4]': 'debug[4]',
            'debug[5]': 'debug[5]',
            'debug[6]': 'debug[6]',
            'debug[7]': 'debug[7]'
        },
        1: {       //AGL
            'debug[all]': 'Debug ABOVE GROUND LEVEL',
            'debug[0]': 'Surface Reliability x1000',
            'debug[1]': 'AGL Quality',
            'debug[2]': 'AGL Altitude',
            'debug[3]': 'AGL Velocity',
            'debug[4]': 'debug[4]',
            'debug[5]': 'debug[5]',
            'debug[6]': 'debug[6]',
            'debug[7]': 'debug[7]'
        },
        2: {	    //FLOW_RAW
            'debug[all]': 'Debug FLOW RAW',
            'debug[0]': 'X Flow Rate',
            'debug[1]': 'Y Flow Rate',
            'debug[2]': 'X Body Rate',
            'debug[3]': 'Y Body Rate',
            'debug[4]': '[empty]',
            'debug[5]': '[empty]',
            'debug[6]': '[empty]',
            'debug[7]': '[empty]'
        },
        3: {	    //FLOW
            'debug[all]': 'Debug FLOW',
            'debug[0]': 'X Flow Rate (deg)',
            'debug[1]': 'Y Flow Rate (deg)',
            'debug[2]': 'X Flow Coordinate',
            'debug[3]': 'Y Flow Coordinate',
            'debug[4]': '[empty]',
            'debug[5]': '[empty]',
            'debug[6]': '[empty]',
            'debug[7]': '[empty]'
        },
        5: {	    //SAG_COMP_VOLTAGE
            'debug[all]': 'Debug SAG COMPENSATION',
            'debug[0]': 'Power Supply Impedance',
            'debug[1]': 'Sage Compenstation',
            'debug[2]': '[empty]',
            'debug[3]': '[empty]',
            'debug[4]': '[empty]',
            'debug[5]': '[empty]',
            'debug[6]': '[empty]',
            'debug[7]': '[empty]'
        },
        6: {	    //VIBE
            'debug[all]': 'Debug ACC VIBE',
            'debug[0]': 'ACC X Vibe Level',
            'debug[1]': 'ACC Y Vibe Level',
            'debug[2]': 'ACC Z Vibe Level',
            'debug[3]': 'SCC Clip Count',
            'debug[4]': '[empty]',
            'debug[5]': '[empty]',
            'debug[6]': '[empty]',
            'debug[7]': '[empty]'
        },
        10: {	    //ACC
            'debug[all]': 'Debug ACCELEROMETER',
            'debug[0]': 'Roll RAW ACC',
            'debug[1]': 'Pitch RAW ACC',
            'debug[2]': 'Vertical RAW ACC',
            'debug[3]': '[empty]',
            'debug[4]': '[empty]',
            'debug[5]': '[empty]',
            'debug[6]': '[empty]',
            'debug[7]': '[empty]'
        },
        11: {	    //NAV_YAW
            'debug[all]': 'Debug NAV YAW',
            'debug[0]': 'Yaw Heading P-Term',
            'debug[1]': 'Yaw Heading I-Term',
            'debug[2]': 'Yaw Heading D-Term',
            'debug[3]': 'Heading Error',
            'debug[4]': 'Heading Output Constrained',
            'debug[5]': '[empty]',
            'debug[6]': '[empty]',
            'debug[7]': '[empty]'
        },
        13: {	    //DYN_GYRO
            'debug[all]': 'Debug DYN GYRO LPF',
            'debug[0]': 'Gyro LPF Cutoff',
            'debug[1]': '[empty]',
            'debug[2]': '[empty]',
            'debug[3]': '[empty]',
            'debug[4]': '[empty]',
            'debug[5]': '[empty]',
            'debug[6]': '[empty]',
            'debug[7]': '[empty]'
        },
        14: {	    //AUTOLEVEL
            'debug[all]': 'Debug AUTOLEVEL',
            'debug[0]': 'Target Angle x10',
            'debug[1]': 'Level Trim x10',
            'debug[2]': 'Vertical Velocity',
            'debug[3]': 'Target Angle',
            'debug[4]': 'Level Trim Multiplier',
            'debug[5]': '[empty]',
            'debug[6]': '[empty]',
            'debug[7]': '[empty]'
        },
        15: {	    //ALTITUDE
            'debug[all]': 'Debug ALTITUDE',
            'debug[0]': 'Position estimate',
            'debug[1]': 'Vertical speed estimate',
            'debug[2]': 'Baro altitude',
            'debug[3]': 'Vertical acceleration on earth frame',
            'debug[4]': 'GPS altitude',
            'debug[5]': 'GPS vertical speed',
            'debug[6]': 'Vibration level',
            'debug[7]': 'Clip count'
        },
        16: {	    //AUTOTRIM
            'debug[all]': 'Debug AUTOTRIM',
            'debug[0]': 'Servo2 Middle',
            'debug[1]': 'Middle Update Count',
            'debug[2]': 'Servo3 Middle',
            'debug[3]': 'Max of Rotation or Target',
            'debug[4]': 'Servo4 Middle',
            'debug[5]': 'Roll I-term',
            'debug[6]': 'Servo5 Middle',
            'debug[7]': 'Pitch I-term'
        },
        18: {	    //RATE_DYNAMICS
            'debug[all]': 'Debug RATE DYNAMICS',
            'debug[0]': 'Roll RC Command',
            'debug[1]': 'Roll after Rate Dynamics',
            'debug[2]': 'Pitch RC Command',
            'debug[3]': 'Pitch after Rate Dynamics',
            'debug[4]': 'Yaw RC Command',
            'debug[5]': 'Yaw after Rate Dynamics',
            'debug[6]': '[empty]',
            'debug[7]': '[empty]'
        },
        20: {	    //POS_EST
            'debug[all]': 'Debug POS_EST',
            'debug[0]': 'Position estimat X',
            'debug[1]': 'Position estimate Y',
            'debug[2]': 'Position estimate Z',
            'debug[3]': 'Speed estimate VX',
            'debug[4]': 'Speed estimate VY',
            'debug[5]': 'Speed estimate VZ',
            'debug[6]': 'Yaw estimate',
            'debug[7]': 'navPositionEstimationFlags'
        }
    };

    function presentFlags(flags, flagNames) {
        var
            printedFlag = false,
            i,
            result = "";

        i = 0;

        while (flags > 0) {
            if ((flags & 1) != 0) {
                if (printedFlag) {
                    result += " | ";
                } else {
                    printedFlag = true;
                }

                result += flagNames[i];
            }

            flags >>>= 1;
            i++;
        }

        if (printedFlag) {
            return result;
        } else {
            return "0"; //No flags set
        }
    }

    // Only list events that have changed, flag with eirer go ON or OFF.
    FlightLogFieldPresenter.presentChangeEvent = function presentChangeEvent(flags, lastFlags, flagNames) {
        var eventState = '';
        var found = false;
        for (var i = 0; i <= 31; i++) {
            if ((1 << i) & (flags ^ lastFlags)) { // State Changed
                eventState += '|' + flagNames[i] + ' ' + (((1 << i) & flags) ? 'ON' : 'OFF');
                found = true;
            }
        }
        if (!found) { eventState += ' | ACRO'; } // Catch the state when all flags are off, which is ACRO of course
        return eventState;
    };

    function presentEnum(value, enumNames) {
        if (enumNames[value] === undefined)
            return value;

        return enumNames[value];
    }

    /**
     * Attempt to decode the given raw logged value into something more human readable, or return an empty string if
     * no better representation is available.
     *
     * @param fieldName Name of the field
     * @param value Value of the field
     */
    FlightLogFieldPresenter.decodeFieldToFriendly = function (flightLog, fieldName, value, currentFlightMode) {
        if (value === undefined)
            return "";

        switch (fieldName) {
            case 'time':
                return formatTime(value / 1000, true);

            case 'gyroADC[0]':
            case 'gyroADC[1]':
            case 'gyroADC[2]':
                return value.toFixed(0) + ' deg/s';

            case 'gyroRaw[0]':
            case 'gyroRaw[1]':
            case 'gyroRaw[2]':
                return value.toFixed(0) + ' deg/s';

            case 'axisError[0]':
            case 'axisError[1]':
            case 'axisError[2]':
                return Math.round(value) + " deg/s";

            case 'axisRate[0]':
            case 'axisRate[1]':
            case 'axisRate[2]':
                return Math.round(value) + " deg/s";

            case 'rcCommand[0]':
            case 'rcCommand[1]':
            case 'rcCommand[2]':
                return value.toFixed(0);

            //Throttle is scaled to %
            case 'rcCommand[3]':
                return Math.round(flightLog.rcCommandRawToThrottle(value)) + " %";

            case 'motor[0]':
            case 'motor[1]':
            case 'motor[2]':
            case 'motor[3]':
            case 'motor[4]':
            case 'motor[5]':
            case 'motor[6]':
            case 'motor[7]':
                return Math.round(flightLog.rcMotorRawToPct(value)) + " %";

            case 'rcData[0]':
            case 'rcData[1]':
            case 'rcData[2]':
            case 'rcData[3]':
            case 'servo[0]':
            case 'servo[1]':
            case 'servo[2]':
            case 'servo[3]':
            case 'servo[4]':
            case 'servo[5]':
            case 'servo[6]':
            case 'servo[7]':
            case 'servo[8]':
            case 'servo[9]':
            case 'servo[10]':
            case 'servo[11]':
            case 'servo[12]':
            case 'servo[13]':
            case 'servo[14]':
            case 'servo[15]':
            case 'servo[16]':
            case 'servo[17]':
            case 'servo[18]':
            case 'servo[19]':
            case 'servo[20]':
            case 'servo[21]':
            case 'servo[22]':
            case 'servo[23]':
            case 'servo[24]':
            case 'servo[25]':
            case 'servo[26]':
            case 'servo[27]':
            case 'servo[28]':
            case 'servo[29]':
            case 'servo[30]':
            case 'servo[31]':
            case 'servo[32]':
            case 'servo[33]':
                return value.toFixed(0) + "us";

            /*
             * PID values are unitless
             */
            case 'axisSum[0]':
            case 'axisSum[1]':
            case 'axisSum[2]':
            case 'axisP[0]':
            case 'axisP[1]':
            case 'axisP[2]':
            case 'axisI[0]':
            case 'axisI[1]':
            case 'axisI[2]':
            case 'axisD[0]':
            case 'axisD[1]':
            case 'axisD[2]':
            case 'axisF[0]':
            case 'axisF[1]':
            case 'axisF[2]':
            case 'fwAltP':
            case 'fwAltI':
            case 'fwAltD':
            case 'fwAltOut':
                return value.toFixed(0);

            case 'mcPosAxisP[0]':
            case 'mcPosAxisP[1]':
            case 'mcPosAxisP[2]':
            case 'mcVelAxisP[0]':
            case 'mcVelAxisP[1]':
            case 'mcVelAxisP[2]':
            case 'mcVelAxisI[0]':
            case 'mcVelAxisI[1]':
            case 'mcVelAxisI[2]':
            case 'mcVelAxisD[0]':
            case 'mcVelAxisD[1]':
            case 'mcVelAxisD[2]':
            case 'mcVelAxisFF[0]':
            case 'mcVelAxisFF[1]':
            case 'mcVelAxisFF[2]':
            case 'mcVelAxisOut[0]':
            case 'mcVelAxisOut[1]':
            case 'mcVelAxisOut[2]':
                return value.toFixed(0);

            case 'accSmooth[0]':
            case 'accSmooth[1]':
            case 'accSmooth[2]':
                return flightLog.accRawToGs(value).toFixed(2) + "g";

            case 'vbatLatest':
                if ((flightLog.getSysConfig().firmwareType == FIRMWARE_TYPE_BETAFLIGHT && semver.gte(flightLog.getSysConfig().firmwareVersion, '3.1.0')) ||
                    (flightLog.getSysConfig().firmwareType == FIRMWARE_TYPE_CLEANFLIGHT && semver.gte(flightLog.getSysConfig().firmwareVersion, '2.0.0'))) {
                    return (value / 10).toFixed(2) + "V" + ", " + (value / 10 / flightLog.getNumCellsEstimate()).toFixed(2) + "V/cell";
                } else {
                    return (flightLog.vbatADCToMillivolts(value) / 1000).toFixed(2) + "V" + ", " + (flightLog.vbatADCToMillivolts(value) / 1000 / flightLog.getNumCellsEstimate()).toFixed(2) + "V/cell";
                }

            case 'amperageLatest':
                if ((flightLog.getSysConfig().firmwareType == FIRMWARE_TYPE_BETAFLIGHT && semver.gte(flightLog.getSysConfig().firmwareVersion, '3.1.0')) ||
                    (flightLog.getSysConfig().firmwareType == FIRMWARE_TYPE_CLEANFLIGHT && semver.gte(flightLog.getSysConfig().firmwareVersion, '2.0.0'))) {
                    return (value / 100).toFixed(2) + "A" + ", " + (value / 100 / flightLog.getNumMotors()).toFixed(2) + "A/motor";
                } else {
                    return (flightLog.amperageADCToMillivolts(value) / 1000).toFixed(2) + "A" + ", " + (flightLog.amperageADCToMillivolts(value) / 1000 / flightLog.getNumMotors()).toFixed(2) + "A/motor";
                }

            case 'heading[0]':
            case 'heading[1]':
            case 'heading[2]':
            case 'windHeading':
                return (value / Math.PI * 180).toFixed(1) + "deg";

            case 'BaroAlt':
                return (value / 100).toFixed(2) + "m";

            case "navEPH":
                return (value/100).toFixed(2);

            case "navPos[2]":
            case "navTgtPos[2]":
                return (value / 100).toFixed(2) + "m";

            case 'flightModeFlags':
                return presentFlags(value, FLIGHT_LOG_FLIGHT_MODE_NAME);

            case 'flightModeFlags2':
                return presentFlags(value, FLIGHT_LOG_FLIGHT_MODE_NAME_2);

            case 'activeFlightModeFlags':
                return presentFlags(value, FLIGHT_LOG_ACTIVE_FLIGHT_MODE_NAME);

            case 'stateFlags':
                return presentFlags(value, FLIGHT_LOG_FLIGHT_STATE_NAME);

            case 'failsafePhase':
                return presentEnum(value, FLIGHT_LOG_FAILSAFE_PHASE_NAME);

            case 'navState':
                return presentEnum(value, FLIGHT_LOG_NAV_STATE);

            case 'navFlags':
                return presentFlags(value, FLIGHT_LOG_NAV_FLAGS);

            case 'hwHealthStatus':
                return FlightLogFieldPresenter.decodeHwHealth(value);

            case 'debug[0]':
            case 'debug[1]':
            case 'debug[2]':
            case 'debug[3]':
            case 'debug[4]':
            case 'debug[5]':
            case 'debug[6]':
            case 'debug[7]':
                return FlightLogFieldPresenter.decodeDebugFieldToFriendly(flightLog, fieldName, value, currentFlightMode);

            case 'navVel[0]':
            case 'navVel[1]':
            case 'navTgtVel[0]':
            case 'navTgtVel[1]':
            case 'velocity':
            case 'wind[0]':
            case 'wind[1]':
            case 'windVelocity':
                if (userSettings.velocityUnits == 'I') // Imperial
                    return (value * 0.0223694).toFixed(1) + "mph";
                if (userSettings.velocityUnits == 'M') // Metric
                    return (value * 0.036).toFixed(1) + "kph";
                return (value / 100).toFixed(2) + "m/s"; // Default

            case 'navVel[2]': // Vertical speed always in m/s
            case 'navTgtVel[2]':
            case 'wind[2]':
                return (value / 100).toFixed(2) + "m/s";

            case 'rssi':
                return Math.round(value / 10.24) + "%";

            case 'amperage':
                return (value / 100.0).toFixed(2) + "A";

            case 'vbat':
            case 'sagCompensatedVBat':
                return (value / 100.0).toFixed(2) + "V";

            case 'IMUTemperature':
            case 'baroTemperature':
            case 'sens0Temp':
            case 'sens1Temp':
            case 'sens2Temp':
            case 'sens3Temp':
            case 'sens4Temp':
            case 'sens5Temp':
            case 'sens6Temp':
            case 'sens7Temp':
            case 'escTemperature':
                return (value == -1250) ? "" : (value / 10.0).toFixed(1) + '&deg;';

            default:
                return value.toString();
        }
    };

    FlightLogFieldPresenter.decodeDebugFieldToFriendly = function (flightLog, fieldName, value, currentFlightMode) {
        if (flightLog) {
            var debugModeName = DEBUG_MODE[flightLog.getSysConfig().debug_mode]; // convert to recognisable name
            switch (debugModeName) {
                case 'GYRO':
                case 'NOTCH':
                case 'RPM_FILTER':
                    return Math.round(flightLog.gyroRawToDegreesPerSecond(value)) + "deg/s";
                default:
                    return value;
            }
        }
        return "";
    };

    FlightLogFieldPresenter.fieldNameToFriendly = function (fieldName, debugMode) {

        if (debugMode && fieldName.includes('debug')) {
            var debugFields = DEBUG_FRIENDLY_FIELD_NAMES[debugMode];

            if (debugFields !== undefined) {
                return debugFields[fieldName];
            } else {
                return DEBUG_FRIENDLY_FIELD_NAMES[0][fieldName];
            }
        }

        if (FRIENDLY_FIELD_NAMES[fieldName]) {
            return FRIENDLY_FIELD_NAMES[fieldName];
        }

        return fieldName;
    };

    FlightLogFieldPresenter.decodeHwHealth = function (healthStatus) {
        const SENSOR_STATUS = [ "", " OK", " UNAVAIL", " UNHEALTHY" ];
        const SENSOR_TYPES = [ "GYRO", "ACCEL", "COMP", "BARO", "GPS", "RANGE", "PITOT" ];
        let retVal = "";
        SENSOR_TYPES.forEach((sensor, index) => {
            let status = (healthStatus >> (index * 2)) & 0x03;
            if (status !== 0)
                retVal += (retVal ? " | " : "") + sensor + SENSOR_STATUS[status];
        });
        return retVal;
    };
})();
