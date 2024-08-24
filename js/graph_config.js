"use strict";

function GraphConfig(graphConfig) {
    var
        graphs = graphConfig ? graphConfig : [],
        listeners = [],
        that = this;
    
    function notifyListeners() {
        for (var i = 0; i < listeners.length; i++) {
            listeners[i](that);
        }
    }
    
    this.selectedFieldName  = null;
    this.selectedGraphIndex = 0;
    this.selectedFieldIndex = 0;

    this.getGraphs = function() {
        return graphs;
    };
    
    /**
     * newGraphs is an array of objects like {label: "graph label", height:, fields:[{name: curve:{offset:, power:, inputRange:, outputRange:, steps:}, color:, }, ...]}
     */
    this.setGraphs = function(newGraphs) {
        graphs = newGraphs;
        
        notifyListeners();
    };
    
    /**
     * Convert the given graph configs to make them appropriate for the given flight log.
     */
    this.adaptGraphs = function(flightLog, graphs) {
        var 
            logFieldNames = flightLog.getMainFieldNames(),
            
            // Make copies of graphs into here so we can modify them without wrecking caller's copy
            newGraphs = [];
                    
        for (var i = 0; i < graphs.length; i++) {
            var 
                graph = graphs[i],
                newGraph = $.extend(
                    // Default values for missing properties:
                    {
                        height: 1
                    }, 
                    // The old graph
                    graph, 
                    // New fields to replace the old ones:
                    {
                        fields:[]
                    }
                ),
                colorIndex = 0;
            
            for (var j = 0; j < graph.fields.length; j++) {
                var
                    field = graph.fields[j],
                    matches;
                
                var adaptField = function(field, colorIndexOffset, forceNewCurve) {
                    const defaultCurve = GraphConfig.getDefaultCurveForField(flightLog, field.name);
                    

                    if (field.curve === undefined || forceNewCurve) {
                        field.curve = defaultCurve;
                    } else {
                        /* The curve may have been originally created for a craft with different endpoints, so use the 
                         * recommended offset and input range instead of the provided one.
                         */
                        field.curve.offset = defaultCurve.offset;
                        field.curve.inputRange = defaultCurve.inputRange;
                    }
                    
                    if(colorIndexOffset!=null && field.color != undefined) { // auto offset the actual color (to expand [all] selections)
                        var index;
                        for(index=0; index < GraphConfig.PALETTE.length; index++)
                            {
                                if(GraphConfig.PALETTE[index].color == field.color) break;
                            }
                        field.color = GraphConfig.PALETTE[(index + colorIndexOffset) % GraphConfig.PALETTE.length].color
                    }

                    if (field.color === undefined) {
                        field.color = GraphConfig.PALETTE[colorIndex % GraphConfig.PALETTE.length].color;
                        colorIndex++;
                    }
                    
                    if (field.smoothing === undefined) {
                        field.smoothing = GraphConfig.getDefaultSmoothingForField(flightLog, field.name);
                    }
                    
                    return field;
                };
                
                if ((matches = field.name.match(/^(.+)\[all\]$/))) {
                    var 
                        nameRoot = matches[1],
                        nameRegex = new RegExp("^" + nameRoot + "\[[0-9]+\]$"),
                        colorIndexOffset = 0;
                    
                    for (var k = 0; k < logFieldNames.length; k++) {
                        if (logFieldNames[k].match(nameRegex)) {
                            // add special condition for rcCommand as each of the fields requires a different scaling.
                            newGraph.fields.push(adaptField($.extend({}, field, {name: logFieldNames[k]}), colorIndexOffset, (nameRoot=='rcCommand')));
                            colorIndexOffset++;
                        }
                    }
                } else {
                    // Don't add fields if they don't exist in this log
                    if (flightLog.getMainFieldIndexByName(field.name) !== undefined) {
                        newGraph.fields.push(adaptField($.extend({}, field)));
                    }
                }
            }
            
            newGraphs.push(newGraph);
        }
        
        this.setGraphs(newGraphs);
    };
    
    this.addListener = function(listener) {
        listeners.push(listener);
    };
}

GraphConfig.PALETTE = [
    {color: "#fb8072", name: "Red" },
    {color: "#8dd3c7", name: "Cyan" },
    {color: "#ffffb3", name: "Yellow" },
    {color: "#bebada", name: "Purple" },
    {color: "#80b1d3", name: "Blue" },
    {color: "#fdb462", name: "Orange" },
    {color: "#b3de69", name: "Green" },
    {color: "#fccde5", name: "Pink" },
    {color: "#d9d9d9", name: "Grey" },
    {color: "#bc80bd", name: "Dark Purple" },
    {color: "#ccebc5", name: "Light Green" },
    {color: "#ffed6f", name: "Dark Yellow" }
];


GraphConfig.load = function(config) {
    // Upgrade legacy configs to suit the newer standard by translating field names
    if (config) {
        for (var i = 0; i < config.length; i++) {
            var graph = config[i];
            
            for (var j = 0; j < graph.fields.length; j++) {
                var 
                    field = graph.fields[j],
                    matches;
                
                if ((matches = field.name.match(/^gyroData(.+)$/))) {
                    field.name = "gyroADC" + matches[1];
                }
            }
        }
    } else {
        config = false;
    }
    
    return config;
};

(function() {
    var
    EXAMPLE_GRAPHS = [
        {
            label: "Gyros",
            fields: ["gyroADC[all]"]
        },
        {
            label: "Setpoint",
            fields: ["axisRate[all]"]
        },
        {
            label: "Gyro + PID roll",
            fields: ["axisP[0]", "axisI[0]", "axisD[0]", "axisF[0]", "gyroADC[0]", "axisRate[0]"]
        },
        {
            label: "Gyro + PID pitch",
            fields: ["axisP[1]", "axisI[1]", "axisD[1]", "axisF[1]", "gyroADC[1]", "axisRate[1]"]
        },
        {
            label: "Gyro + PID yaw",
            fields: ["axisP[2]", "axisI[2]", "axisD[2]", "axisF[2]", "gyroADC[2]", "axisRate[2]"]
        },
        {
            label: "Motors",
            fields: ["motor[all]", "servo[5]"]
        },
        {	/* Add custom graph configurations to the main menu ! */
            label: "RC Command",
            fields: ["rcCommand[all]"]
        },
        {
            label: "PID Sum",
            fields: ["axisSum[all]"]
        },
        {
            label: "PID Error",
            fields: ["axisError[all]"]
        },             
        {
            label: "Accelerometers",
            fields: ["accSmooth[all]"]
        }
    ];

    GraphConfig.getDefaultSmoothingForField = function(flightLog, fieldName) {
        try{
            if (fieldName.match(/^motor\[/)) {
                return 5000;
            } else if (fieldName.match(/^servo\[/)) {
                return 5000;
            } else if (fieldName.match(/^gyroADC.*\[/)) {
                return 0;
            } else if (fieldName.match(/^accSmooth\[/)) {
                return 3000;
            } else if (fieldName.match(/^axis.+\[/)) {
                return 3000;
            } else {
                return 0;
            }
        } catch (e) { return 0;}
    };

    GraphConfig.getDefaultCurveForField = function(flightLog, fieldName) {
        var 
            sysConfig = flightLog.getSysConfig();
            minMaxValues = getMinMax(fieldName);

        // This function can be called to scale and center the field based on the whole-log observed ranges for that field.        
        function getMinMax(fieldName) {
            var
                stats = flightLog.getStats(),
                fieldIndex = flightLog.getMainFieldIndexByName(fieldName),
                fieldStat = fieldIndex !== undefined ? stats.field[fieldIndex] : false;

            if (fieldStat) {
                return {
                    offset: - (fieldStat.max + fieldStat.min) / 2,
                    power: 1.0,
                    inputRange: Math.max((fieldStat.max - fieldStat.min) / 2, 1.0),
                    outputRange: 1.0
                };
            } else {
                return {
                    offset: 0,
                    power: 1.0,
                    inputRange: 500,
                    outputRange: 1.0
                };
            }
        };

        try {
            if (fieldName.match(/^motor\[/)) {
                return {
                    offset: -(sysConfig.motorOutput[1] + sysConfig.motorOutput[0]) / 2,
                    power: 1.0,
                    inputRange: (sysConfig.motorOutput[1] - sysConfig.motorOutput[0]) / 2,
                    outputRange: 1.0
                };
            } else if (fieldName.match(/^servo\[/)) {
                return {
                    offset: -1500,
                    power: 1.0,
                    inputRange: 500,
                    outputRange: 1.0
                };
            } else if (fieldName.match(/^gyroADC\[/)) {
                return {
                    offset: 0,
                    power: 0.25, /* Make this 1.0 to scale linearly */
                    inputRange: Math.max(250, (2.0e-3 * Math.PI/180) / sysConfig.gyroScale), //scales based on max deg/s logged
                    outputRange: 1.0
                };
            } else if (fieldName.match(/^gyroRaw\[/)) {
                return {
                    offset: 0,
                    power: 0.25, /* Make this 1.0 to scale linearly */
                    inputRange: Math.max(250, (2.0e-3 * Math.PI/180) / sysConfig.gyroScale), //scales based on max deg/s logged
                    outputRange: 1.0
                };
            } else if (fieldName.match(/^accSmooth\[/)) {
                return {
                    offset: 0,
                    power: 0.5,
                    inputRange: sysConfig.acc_1G * 16.0, /* Reasonable typical maximum for acc */
                    outputRange: 1.0
                };
            } else if (fieldName.match(/^axisError\[/)) { // same range.
                return {
                    offset: 0,
                    power: 0.25, /* Make this 1.0 to scale linearly */
                    inputRange: 2000,
                    outputRange: 1.0
                };
            } else if (fieldName.match(/^axis.+\[/)) {
                return {
                    offset: 0,
                    power: 0.25,
                    inputRange: Math.max(250, (2.0e-3 * Math.PI/180) / sysConfig.gyroScale), //scales based on max deg/s logged
                    outputRange: 1.0
                };
            } else if (fieldName == "rcCommand[3]") { // Throttle
                return {
                    offset: -1500,
                    power: 1.0,
                    inputRange: 500,
                    outputRange: 1.0
                };
            } else if (fieldName.match(/^rcCommand\[/)) {
                return {
                    offset: 0,
                    power: 0.8,
                    inputRange: 500 * (sysConfig.rcRate ? sysConfig.rcRate : 100) / 100,
                    outputRange: 1.0
                };           
            } else if (fieldName.match(/^sonar.*/)) {
                return {
                    offset: -200,
                    power: 1.0,
                    inputRange: 200,
                    outputRange: 1.0
                };
            //Roll NAV position data
            } else if (fieldName.match(/^navPos\[0/)     ||
                       fieldName.match(/^navTgtPos\[0/)) {
                var minMaxValues = getMinMax("navPos[0]");
                    return {
                        offset: minMaxValues.offset,
                        power: minMaxValues.power,
                        inputRange: minMaxValues.inputRange,
                        outputRange: minMaxValues.outputRange,
                    };
            } else if (fieldName.match(/^navTgtVel\[0/)  ||
                       fieldName.match(/^navVel\[0/)) {
                var minMaxValues = getMinMax("navVel[0]");
                    return {
                        offset: 0,
                        power: minMaxValues.power,
                        inputRange: minMaxValues.inputRange,
                        outputRange: minMaxValues.outputRange,
                    };
            } else if (fieldName.match(/^mcVelAxis.*\[0/)  ||
                       fieldName.match(/^mcPosAxis.*\[0/)) {
                var minMaxValues = getMinMax("mcVelAxisOut[0]");
                    return {
                        offset: 0,
                        power: minMaxValues.power,
                        inputRange: minMaxValues.inputRange,
                        outputRange: minMaxValues.outputRange,
                    };
            //Pitch NAV position data
            } else if (fieldName.match(/^navPos\[1/)     ||
                       fieldName.match(/^navTgtPos\[1/)) {
                var minMaxValues = getMinMax("navPos[1]");
                    return {
                        offset: minMaxValues.offset,
                        power: minMaxValues.power,
                        inputRange: minMaxValues.inputRange,
                        outputRange: minMaxValues.outputRange,
                    };
            } else if (fieldName.match(/^navTgtVel\[1/)  ||
                       fieldName.match(/^navVel\[1/)) {
                var minMaxValues = getMinMax("navVel[1]");
                    return {
                        offset: 0,
                        power: minMaxValues.power,
                        inputRange: minMaxValues.inputRange,
                        outputRange: minMaxValues.outputRange,
                    };
            } else if (fieldName.match(/^mcVelAxis.*\[1/)  ||
                       fieldName.match(/^mcPosAxis.*\[1/)) {
                var minMaxValues = getMinMax("mcVelAxisOut[1]");
                    return {
                        offset: 0,
                        power: minMaxValues.power,
                        inputRange: minMaxValues.inputRange,
                        outputRange: minMaxValues.outputRange,
                    };
            //Altitude NAV position data
            } else if (fieldName.match(/^Baro*/)        ||
                       fieldName.match(/^navPos\[2/)     ||
                       fieldName.match(/^navTgtPos\[2/)) {
                var minMaxValues = getMinMax("BaroAlt");
                    return {
                        offset: minMaxValues.offset,
                        power: minMaxValues.power,
                        inputRange: minMaxValues.inputRange,
                        outputRange: minMaxValues.outputRange,
                    };
            } else if (fieldName.match(/^navTgtVel\[2/)  ||
                       fieldName.match(/^navVel\[2/)) {
                var minMaxValues = getMinMax("navVel[2]");
                    return {
                        offset: 0,
                        power: minMaxValues.power,
                        inputRange: minMaxValues.inputRange,
                        outputRange: minMaxValues.outputRange,
                    };
            } else if (fieldName.match(/^mcVelAxis.*\[2/)  ||
                       fieldName.match(/^mcPosAxis.*\[2/)) {
                var minMaxValues = getMinMax("mcVelAxisOut[2]");
                    return {
                        offset: 0,
                        power: minMaxValues.power,
                        inputRange: minMaxValues.inputRange * 1.75,
                        outputRange: minMaxValues.outputRange,
                    };
            //Altitude NAV position data Fixed Wing
            } else if (fieldName.match(/^fwAlt*/)) {
                var minMaxValues = getMinMax("fwAltOut");
                    return {
                        offset: 0,
                        power: minMaxValues.power,
                        inputRange: minMaxValues.inputRange * 1.75,
                        outputRange: minMaxValues.outputRange,
                    };
            } else if (fieldName.match(/^fwPos*/)) {
                var minMaxValues = getMinMax("fwPosOut");
                    return {
                        offset: 0,
                        power: minMaxValues.power,
                        inputRange: minMaxValues.inputRange * 1.75,
                        outputRange: minMaxValues.outputRange,
                    };
            } else if (fieldName.match(/^attitude\[/)) {
                var minMaxValues = getMinMax("attitude[2]");
                    return {
                        offset: 0,
                        power: minMaxValues.power,
                        inputRange: minMaxValues.inputRange * 1.75,
                        outputRange: minMaxValues.outputRange,
                    }; 
            } else if (fieldName.match(/^debug.*/) && sysConfig.debug_mode!=null) {

                var debugModeName = DEBUG_MODE[sysConfig.debug_mode]; 
                switch (debugModeName) {
                    case 'CYCLETIME':
                        switch (fieldName) {
                            case 'debug[1]': //CPU Load
                                return {
                                    offset: -50,
                                    power: 1,
                                    inputRange: 50,
                                    outputRange: 1.0
                                };                            
                            default:
                                return {
                                    offset: -1000,    // zero offset
                                    power: 1.0,
                                    inputRange: 1000, //  0-2000uS
                                    outputRange: 1.0
                                };
                        }
                    case 'PIDLOOP': 
                            return {
                                offset: -250,    // zero offset
                                power: 1.0,
                                inputRange: 250, //  0-500uS
                                outputRange: 1.0
                            };       
                    case 'GYRO':
                    case 'NOTCH':
                        return {
                            offset: 0,
                            power: 0.25,
                            inputRange: (2.0e-3 * Math.PI/180) / sysConfig.gyroScale,
                            outputRange: 1.0
                        };
                    case 'ACCELEROMETER':
                        return {
                            offset: 0,
                            power: 0.5,
                            inputRange: sysConfig.acc_1G * 16.0, /* Reasonable typical maximum for acc */
                            outputRange: 1.0
                        };
                    case 'MIXER':
                        return {
                            offset: -(sysConfig.motorOutput[1] + sysConfig.motorOutput[0]) / 2,
                            power: 1.0,
                            inputRange: (sysConfig.motorOutput[1] - sysConfig.motorOutput[0]) / 2,
                            outputRange: 1.0
                        };
                    case 'BATTERY':
                        switch (fieldName) {
                            case 'debug[0]': //Raw Value (0-4095)
                                return {
                                    offset: -2048,
                                    power: 1,
                                    inputRange: 2048,
                                    outputRange: 1.0
                                };                            
                            default:
                                return {
                                    offset: -130,
                                    power: 1.0,
                                    inputRange: 130, // 0-26.0v
                                    outputRange: 1.0
                                };
                        }
                    case 'ANGLERATE':
                        return {
                            offset: 0,
                            power: 0.25, /* Make this 1.0 to scale linearly */
                            inputRange: flightLog.gyroRawToDegreesPerSecond((2.0e-3 * Math.PI/180) / sysConfig.gyroScale),
                            outputRange: 1.0
                        };
                    case 'DEBUG_FFT':
                        return {
                            offset: 0,
                            power: 0.25,
                            inputRange: (2.0e-3 * Math.PI/180) / sysConfig.gyroScale,
                            outputRange: 1.0
                        };      
                    case 'DEBUG_FFT_FREQ':
                        return {
                            offset: 0,
                            power: 0.25,
                            inputRange: (2.0e-3 * Math.PI/180) / sysConfig.gyroScale,
                            outputRange: 1.0
                        };     
                    case 'DEBUG_FFT_TIME':
                        return {
                            offset: 0,
                            power: 1.0,
                            inputRange: 100,
                            outputRange: 1.0
                        };      
                }
            }
            // if not found above then
            var minMaxValues = getMinMax(fieldName);
                return {
                    offset: minMaxValues.offset,
                    power: minMaxValues.power,
                    inputRange: minMaxValues.inputRange,
                    outputRange: minMaxValues.outputRange,
                };

        } catch(e) {
            return {
                offset: 0,
                power: 1.0,
                inputRange: 500,
                outputRange: 1.0
            };
        }
    };
    
    /**
     * Get an array of suggested graph configurations will be usable for the fields available in the given flightlog.
     * 
     * Supply an array of strings `graphNames` to only fetch the graph with the given names.
     */
    GraphConfig.getExampleGraphConfigs = function(flightLog, graphNames) {
        var
            result = [],
            i, j;
        
        for (i = 0; i < EXAMPLE_GRAPHS.length; i++) {
            var
                srcGraph = EXAMPLE_GRAPHS[i],
                destGraph = {
                    label: srcGraph.label, 
                    fields: [],
                    height: srcGraph.height || 1
                },
                found;
            
            if (graphNames !== undefined) {
                found = false;
                for (j = 0; j < graphNames.length; j++) {
                    if (srcGraph.label == graphNames[j]) {
                        found = true;
                        break;
                    }
                }
                
                if (!found) {
                    continue;
                }
            }
            
            for (j = 0; j < srcGraph.fields.length; j++) {
                var 
                    srcFieldName = srcGraph.fields[j],
                    destField = {
                        name: srcFieldName
                    };
                
                destGraph.fields.push(destField);
            }
            
            result.push(destGraph);
        }
        
        return result;
    };
})();
