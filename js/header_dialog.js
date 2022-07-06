/*global $ */
'use strict';

function HeaderDialog(dialog, onSave) {

	// Private Variables


	var that = this; 		// generic pointer back to this function
	var activeSysConfig;	// pointer to the current system configuration

	/** By default, all parameters are shown on the header
		however, specific firmware version parameters can be hidden
		by adding them to this variable
	**/

	var parameterVersion = [
		{ name: 'superExpoFactor', type: FIRMWARE_TYPE_BETAFLIGHT, min: '2.6.0', max: '2.7.9' },
		{ name: 'superExpoFactorYaw', type: FIRMWARE_TYPE_BETAFLIGHT, min: '2.7.0', max: '2.7.9' },
		{ name: 'rcYawRate', type: FIRMWARE_TYPE_BETAFLIGHT, min: '2.8.0', max: '999.9.9' },
		{ name: 'airmode_activate_throttle', type: FIRMWARE_TYPE_BETAFLIGHT, min: '2.8.0', max: '999.9.9' },
		{ name: 'gyro_notch_hz', type: FIRMWARE_TYPE_BETAFLIGHT, min: '3.0.0', max: '999.9.9' },
		{ name: 'gyro_notch_cutoff', type: FIRMWARE_TYPE_BETAFLIGHT, min: '3.0.0', max: '999.9.9' },
		{ name: 'dterm_notch_hz', type: FIRMWARE_TYPE_BETAFLIGHT, min: '3.0.0', max: '999.9.9' },
		{ name: 'dterm_notch_cutoff', type: FIRMWARE_TYPE_BETAFLIGHT, min: '3.0.0', max: '999.9.9' },
		{ name: 'motor_pwm_rate', type: FIRMWARE_TYPE_BETAFLIGHT, min: '3.0.0', max: '999.9.9' },
		{ name: 'dterm_filter_type', type: FIRMWARE_TYPE_BETAFLIGHT, min: '3.0.0', max: '999.9.9' },
		{ name: 'itermThrottleGain', type: FIRMWARE_TYPE_BETAFLIGHT, min: '3.0.0', max: '3.0.1' },
		{ name: 'dterm_setpoint_weight', type: FIRMWARE_TYPE_BETAFLIGHT, min: '3.0.0', max: '999.9.9' },
		{ name: 'gyro_soft_type', type: FIRMWARE_TYPE_BETAFLIGHT, min: '3.0.0', max: '999.9.9' },
		{ name: 'debug_mode', type: FIRMWARE_TYPE_BETAFLIGHT, min: '3.0.0', max: '999.9.9' },
		{ name: 'gyro_notch_hz_2', type: FIRMWARE_TYPE_BETAFLIGHT, min: '3.0.1', max: '999.9.9' },
		{ name: 'gyro_notch_cutoff_2', type: FIRMWARE_TYPE_BETAFLIGHT, min: '3.0.1', max: '999.9.9' },
		{ name: 'pidController', type: FIRMWARE_TYPE_BETAFLIGHT, min: '0.0.0', max: '3.0.1' },
		{ name: 'motorOutputLow', type: FIRMWARE_TYPE_BETAFLIGHT, min: '3.1.0', max: '999.9.9' },
		{ name: 'motorOutputHigh', type: FIRMWARE_TYPE_BETAFLIGHT, min: '3.1.0', max: '999.9.9' },
		{ name: 'digitalIdleOffset', type: FIRMWARE_TYPE_BETAFLIGHT, min: '3.1.0', max: '999.9.9' },
		{ name: 'antiGravityGain', type: FIRMWARE_TYPE_BETAFLIGHT, min: '3.1.0', max: '999.9.9' },
		{ name: 'antiGravityThreshold', type: FIRMWARE_TYPE_BETAFLIGHT, min: '3.1.0', max: '999.9.9' },
		{ name: 'itermWindupPointPercent', type: FIRMWARE_TYPE_BETAFLIGHT, min: '3.1.0', max: '999.9.9' }
	];

	function isParameterValid(name) {

		for (var i = 0; i < parameterVersion.length; i++) {
			if (parameterVersion[i].name == name && parameterVersion[i].type == activeSysConfig.firmwareType) {
				return (semver.gte(activeSysConfig.firmwareVersion, parameterVersion[i].min) && semver.lte(activeSysConfig.firmwareVersion, parameterVersion[i].max));
			}
		}
		return true; // default is to show parameter
	}

	function renderOptions(selected, index, list) {
		var
			option = $("<option></option>")
				.text(list[index])
				.attr("value", index);

		if (index == selected) {
			option.attr("selected", "selected");
		}

		return option;
	}

	function renderSelect(name, selected, list) {
		// Populate a select drop-down box
		var parameterElem = $('.parameter td[name="' + name + '"]');
		var selectElem = $('select', parameterElem);
		selectElem.children().remove(); // clear list
		for (var i = 0; i < list.length; i++) {
			selectElem.append(renderOptions(selected, i, list));
		}
		parameterElem.attr('title', 'set ' + name + '=' + list[selectElem.val()]);

		parameterElem.css('display', isParameterValid(name) ? ('table-cell') : ('none'));

		if (selected != null) {
			parameterElem.removeClass('missing');
		} else {
			parameterElem.addClass('missing');
		}

	}

	function setParameter(name, data, decimalPlaces) {
		var parameterElem = $('.parameter td[name="' + name + '"]');
		var nameElem = $('input', parameterElem);
		if (data != null) {
			nameElem.val((data / Math.pow(10, decimalPlaces)).toFixed(decimalPlaces));
			nameElem.attr('decPl', decimalPlaces);
			parameterElem.attr('title', 'set ' + name + '=' + data);
			parameterElem.removeClass('missing');
		} else {
			parameterElem.addClass('missing');
		}
		parameterElem.css('display', isParameterValid(name) ? ('table-cell') : ('none'));

	}

	function setParameterFloat(name, data, decimalPlaces) {
		var parameterElem = $('.parameter td[name="' + name + '"]');
		var nameElem = $('input', parameterElem);
		if (data != null) {
			nameElem.val(data.toFixed(decimalPlaces));
			nameElem.attr('decPl', decimalPlaces);
			parameterElem.attr('title', 'set ' + name + '=' + data);
			parameterElem.removeClass('missing');
		} else {
			parameterElem.addClass('missing');
		}
		parameterElem.css('display', isParameterValid(name) ? ('table-cell') : ('none'));

	}


	function setCheckbox(name, data) {
		var parameterElem = $('.static-features td[name="' + name + '"]');
		var nameElem = $('input', parameterElem);
		if (data != null) {
			var state = (data == 1);
			nameElem.prop('checked', state);
			parameterElem.attr('title', 'set ' + name + '=' + data);
			nameElem.closest('tr').removeClass('missing');
		} else {
			nameElem.closest('tr').addClass('missing');
		}
		parameterElem.parent().css('display', isParameterValid(name) ? ('table-cell') : ('none'));
	}

	function populatePID(name, data) {
		var i = 0;
		console.log(data);
		var nameElem = $('.pid_tuning .' + name + ' input');
		nameElem.each(function () {
			$(this).attr('name', name + '[' + i + ']');
			if (data != null) {
				$(this).closest('tr').removeClass('missing');
				switch (i) {
					case 0:
						if (data[i] != null && isNumber(data[i])) {
							$(this).val((data[i]).toFixed(0));
							$(this).attr('decPl', 1);
							$(this).removeClass('missing');
						} else {
							$(this).addClass('missing');
						}
						i++;
						break;
					case 1:
						if (data[i] != null && isNumber(data[i])) {
							$(this).val((data[i]).toFixed(0));
							$(this).attr('decPl', 3);
							$(this).removeClass('missing');
						} else {
							$(this).addClass('missing');
						}
						i++;
						break;
					case 2:
						if (data[i] != null && isNumber(data[i])) {
							$(this).val(data[i].toFixed(0));
							$(this).attr('decPl', 0);
							$(this).removeClass('missing');
						} else {
							$(this).addClass('missing');
						}
						i++;
						break;

					case 3:
						if (data[i] != null && isNumber(data[i])) {
							$(this).val(data[i].toFixed(0));
							$(this).attr('decPl', 0);
							$(this).removeClass('missing');
						} else {
							$(this).addClass('missing');
						}
						i++;
						break;
				}
			} else $(this).closest('tr').addClass('missing');
		})
	}

	function builtFeaturesList(sysConfig) {

		var value = sysConfig.features;

		var features = [
			// Order from configurator js/fc.js
			{ bit: 0, name: 'THR_VBAT_COMP' },
			{ bit: 1, name: 'VBAT' },
			{ bit: 2, name: 'TX_PROF_SEL' },
			{ bit: 3, name: 'BAT_PROF_AUTOSWITCH' },
			{ bit: 4, name: 'MOTOR_STOP' },
			{ bit: 6, name: 'SOFTSERIAL' },
			{ bit: 7, name: 'GPS' },
			{ bit: 10, name: 'TELEMETRY' },
			{ bit: 11, name: 'CURRENT_METER' },
			{ bit: 12, name: 'REVERSIBLE_MOTORS' },
			{ bit: 15, name: 'RSSI_ADC' },
			{ bit: 16, name: 'LED_STRIP' },
			{ bit: 17, name: 'DASHBOARD' },
			{ bit: 19, name: 'BLACKBOX' },
			{ bit: 22, name: 'AIRMODE' },
			{ bit: 28, name: 'PWM_OUTPUT_ENABLE' },
			{ bit: 29, name: 'OSD' },
			{ bit: 30, name: 'FW_LAUNCH' },
			{ bit: 31, name: 'FW_AUTOTRIM' },
		];

		var features_e = $('.features');
		features_e.children().remove(); // clear list

		for (var i = 0; i < features.length; i++) {
			var row_e;

			row_e = $('<tr><td><label class="option"><input disabled class="feature '
				+ i
				+ ' ios-switch" name="'
				+ features[i].name
				+ '" title="feature ' + ((value & 1 << features[i].bit) ? '' : '-')
				+ features[i].name
				+ '" type="checkbox" bit="' + i + '" /><div><div></div></div></label></td><td><label for="feature-'
				+ i
				+ '">'
				+ features[i].name
				+ '</label></td></tr>');

			var feature_e = row_e.find('input.feature');
			feature_e.prop('checked', (value & 1 << features[i].bit));
			feature_e.data('bit', features[i].bit);

			$('#features-list').append(row_e);
		}
	}

	function renderUnknownHeaders(unknownHeaders) {
		// Build a table of unknown header entries
		try {
			if (unknownHeaders != 0) {
				var table = $('.unknown table');
				var elem = '';
				$("tr:not(:first)", table).remove(); // clear the entries (not the first row which has the title bar)

				for (var i = 0; i < unknownHeaders.length; i++) {
					elem += '<tr><td>' + unknownHeaders[i].name + '</td>' +
						'<td>' + unknownHeaders[i].value + '</td></tr>';
				}

				table.append(elem);
				$('.unknown').show();
			} else {
				$('.unknown').hide();
			}
		} catch (e) {
			$('.unknown').hide();
		}
	}

	function renderSysConfig(sysConfig) {

		activeSysConfig = sysConfig; // Store the current system configuration

		console.log(sysConfig);

		// Update the log header

		$('h5.modal-title-revision').text(((sysConfig['Firmware revision'] != null) ? (' Rev : ' + sysConfig['Firmware revision']) : ''));
		$('h5.modal-title-date').text(((sysConfig['Firmware date'] != null) ? (' Date : ' + sysConfig['Firmware date']) : ''));
		$('h5.modal-title-craft').text(((sysConfig['Craft name'] != null) ? (' Name : ' + sysConfig['Craft name']) : ''));

		switch (sysConfig.firmwareType) {
			case FIRMWARE_TYPE_BETAFLIGHT:
			case FIRMWARE_TYPE_CLEANFLIGHT:
				$('.header-dialog-toggle').hide(); // selection button is not required
				break;
			case FIRMWARE_TYPE_INAV:
				$('[name="rates[0]"] input').attr("step", "10").attr("min", "10").attr("max", "1800");
				$('.header-dialog-toggle').hide(); // selection button is not required
				break;
			default:
				$('.header-dialog-toggle').text('Cleanflight');

				// Toggle Button
				$('.header-dialog-toggle').show(); // Selection button is required
				$('.header-dialog-toggle').click(function () {
					if ($('html').hasClass('isCF')) {
						$('html').addClass('isBF');
						$('html').removeClass('isCF');
						$('.header-dialog-toggle').text('Betaflight');
					} else {
						$('html').removeClass('isBF');
						$('html').addClass('isCF');
						$('.header-dialog-toggle').text('Cleanflight');
					}
				});
		}

		if ((sysConfig.firmware >= 3.0 && sysConfig.firmwareType == FIRMWARE_TYPE_BETAFLIGHT) ||
			(sysConfig.firmware >= 2.0 && sysConfig.firmwareType == FIRMWARE_TYPE_CLEANFLIGHT)) {

			PID_CONTROLLER_TYPE = ([
				'LEGACY',
				'BETAFLIGHT'
			])
		} else {
			PID_CONTROLLER_TYPE = ([
				'UNUSED',
				'MWREWRITE',
				'LUXFLOAT'
			])
		}

		// Populate the ROLL Pid Faceplate
		populatePID('rollPID', sysConfig.rollPID);
		populatePID('pitchPID', sysConfig.pitchPID);
		populatePID('yawPID', sysConfig.yawPID);
		populatePID('altPID', sysConfig.altPID);
		populatePID('velPID', sysConfig.velPID);
		populatePID('magPID', sysConfig.magPID); // this is not an array
		populatePID('posPID', sysConfig.posPID);
		populatePID('posrPID', sysConfig.posrPID);
		populatePID('navrPID', sysConfig.navrPID);

		populatePID('levelPID', sysConfig.levelPID);

		// Fill in data from for the rates object
		setParameter('rcRate', sysConfig.rcRate, 2);
		setParameter('vbatscale', sysConfig.vbatscale, 0);
		setParameter('vbatref', sysConfig.vbatref, 0);
		setParameter('vbatmincellvoltage', sysConfig.vbatmincellvoltage, 1);
		setParameter('vbatmaxcellvoltage', sysConfig.vbatmaxcellvoltage, 1);
		setParameter('vbatwarningcellvoltage', sysConfig.vbatwarningcellvoltage, 1);
		setParameter('minthrottle', sysConfig.minthrottle, 0);
		setParameter('maxthrottle', sysConfig.maxthrottle, 0);
		setParameter('currentMeterOffset', sysConfig.currentMeterOffset, 0);
		setParameter('currentMeterScale', sysConfig.currentMeterScale, 0);
		setParameter('rcExpo', sysConfig.rcExpo, 2);
		setParameter('rcYawRate', sysConfig.rcYawRate, 2);
		setParameter('rcYawExpo', sysConfig.rcYawExpo, 2);
		setParameter('thrMid', sysConfig.thrMid, 2);
		setParameter('thrExpo', sysConfig.thrExpo, 2);
		setParameter('dynThrPID', sysConfig.dynThrPID, 2);
		setParameter('tpa-breakpoint', sysConfig.tpa_breakpoint, 0);
		setParameter('superExpoFactor', sysConfig.superExpoFactor, 2);
		setParameter('superExpoFactorYaw', sysConfig.superExpoFactorYaw, 2);

		if (sysConfig.firmwareType == FIRMWARE_TYPE_INAV) {
			setParameter('rates[0]', sysConfig.rates[0] * 10, 0);
			setParameter('rates[1]', sysConfig.rates[1] * 10, 0);
			setParameter('rates[2]', sysConfig.rates[2] * 10, 0);
		} else {
			setParameter('rates[0]', sysConfig.rates[0], 2);
			setParameter('rates[1]', sysConfig.rates[1], 2);
			setParameter('rates[2]', sysConfig.rates[2], 2);
		}

		setParameter('loopTime', sysConfig.looptime, 0);
		setParameter('itermWindupPointPercent', sysConfig.itermWindupPointPercent, 0);
		setParameter('deadband', sysConfig.deadband, 0);
		setParameter('yaw_deadband', sysConfig.yaw_deadband, 0);
		renderSelect('gyro_lpf', sysConfig.gyro_lpf, GYRO_LPF);
		setParameter('acc_lpf_hz', sysConfig.acc_lpf_hz, 0);
		setParameter('airmode_activate_throttle', sysConfig.airmode_activate_throttle, 0);
		renderSelect('serialrx_provider', sysConfig.serialrx_provider, SERIALRX_PROVIDER);

		if (sysConfig.gyro_notch_hz && sysConfig.gyro_notch_cutoff) {
			setParameter('gyro_notch_hz', sysConfig.gyro_notch_hz[0], 0);
			setParameter('gyro_notch_cutoff', sysConfig.gyro_notch_cutoff[0], 0);
			setParameter('gyro_notch_hz_2', sysConfig.gyro_notch_hz[1], 0);
			setParameter('gyro_notch_cutoff_2', sysConfig.gyro_notch_cutoff[1], 0);
		}

		setParameter('dterm_notch_hz', sysConfig.dterm_notch_hz, 0);
		setParameter('dterm_notch_cutoff', sysConfig.dterm_notch_cutoff, 0);
		setParameter('dterm_lpf_hz', sysConfig.dterm_lpf_hz, 0);
		setParameter('dterm_lpf2_hz', sysConfig.dterm_lpf2_hz, 0);
		setParameter('yaw_lpf_hz', sysConfig.yaw_lpf_hz, 0);
		setParameter('gyro_lpf_hz', sysConfig.gyro_lpf_hz, 0);
		setParameter('gyro_lpf2_hz', sysConfig.gyro_lpf2_hz, 0);

		renderSelect('motor_pwm_protocol', sysConfig.motor_pwm_protocol, FAST_PROTOCOL);
		setParameter('motor_pwm_rate', sysConfig.motor_pwm_rate, 0);
		renderSelect('dterm_filter_type', sysConfig.dterm_filter_type, FILTER_TYPE);
		setParameterFloat('dterm_setpoint_weight', sysConfig.dterm_setpoint_weight, 2);

		setParameter('axisAccelerationLimitYaw', sysConfig.axisAccelerationLimitYaw, 0);
		setParameter('axisAccelerationLimitRollPitch', sysConfig.axisAccelerationLimitRollPitch, 0);

		renderSelect('gyro_soft_type', sysConfig.gyro_soft_type, FILTER_TYPE);
		renderSelect('debug_mode', sysConfig.debug_mode, DEBUG_MODE);
		setParameter('motorOutputLow', sysConfig.motorOutput[0], 0);
		setParameter('motorOutputHigh', sysConfig.motorOutput[1], 0);
		setParameter('digitalIdleOffset', sysConfig.digitalIdleOffset, 2);
		setParameter('antiGravityGain', sysConfig.anti_gravity_gain, 0);
		setParameter('antiGravityThreshold', sysConfig.anti_gravity_threshold, 0);

		/* Packed Flags */

		builtFeaturesList(sysConfig);

		/* Hardware selections */

		renderSelect('acc_hardware', sysConfig.acc_hardware, ACC_HARDWARE);
		renderSelect('baro_hardware', sysConfig.baro_hardware, BARO_HARDWARE);
		renderSelect('mag_hardware', sysConfig.mag_hardware, MAG_HARDWARE);

		/* Booleans */
		setCheckbox('vbat_pid_compensation', sysConfig.vbat_pid_compensation);

		/* Show Unknown Fields */
		renderUnknownHeaders(sysConfig.unknownHeaders);

		/* Remove some version specific headers */
		if (activeSysConfig.firmwareType == FIRMWARE_TYPE_BETAFLIGHT && semver.gte(activeSysConfig.firmwareVersion, '3.1.0')) {
			$(".BFPIDController").css("display", "none");
		} else {
			$(".BFPIDController").css("display", "table-header-group");
		}

		/*
		 * In case of INAV, hide irrelevant options
		 */
		if (sysConfig.firmwareType == FIRMWARE_TYPE_INAV) {
			$(".no-inav").hide();
			$(".bf-only").hide();
		}

	}

	function convertUIToSysConfig() {
		console.log('Saving....');
		var newSysConfig = {};

		// Scan all the parameters
		$(".parameter input").each(function () {
			if ($(this).val() != null) {
				var matches = $(this).attr('name').match(/(.+)\[(\d+)\]/);
				if (matches != null) { // this is a variable in an array
					if (newSysConfig[matches[1]] == null) { // array doesn't exist, create it
						newSysConfig[matches[1]] = [];
					}
					var newArray = newSysConfig[matches[1]];
					if ($(this).attr('decPl') != null) {
						newArray[matches[2]] = (parseFloat($(this).val()) * Math.pow(10, $(this).attr('decPl')));
					} else {
						newArray[matches[2]] = (($(this).val() == 'on') ? 1 : 0);
					}
				} else { // this is just a straight field variable
					if ($(this).attr('decPl') != null) {
						newSysConfig[$(this).attr('name')] = (parseFloat($(this).val()) * Math.pow(10, $(this).attr('decPl')));
					} else {
						newSysConfig[$(this).attr('name')] = (($(this).val() == 'on') ? 1 : 0);
					}
				}
			}
		});

		// Scan all the drop-down lists
		$(".parameter select").each(function () {
			if ($(this).val() != null) {
				newSysConfig[$(this).attr('name')] = parseInt($(this).val());
			}
		});


		// Scan the pid_tuning table
		$(".pid_tuning input").each(function () {
			if ($(this).val() != null) {
				if ($(this).attr('decPl') != null) {
					var matches = $(this).attr('name').match(/(.+)\[(\d+)\]/);
					if (matches != null) {
						if (newSysConfig[matches[1]] == null) newSysConfig[matches[1]] = [null, null, null];
						var newArray = newSysConfig[matches[1]];
						newArray[matches[2]] = (parseFloat($(this).val()) * Math.pow(10, $(this).attr('decPl')));
					} else (parseFloat($(this).val()) * Math.pow(10, $(this).attr('decPl')));
				} else {
					newSysConfig[$(this).attr('name')] = $(this).val();
				}
			}
		});

		//Build the features value
		var newFeatureValue = 0;
		$(".features td input").each(function () {
			if ($(this).prop('checked')) {
				newFeatureValue |= (1 << parseInt($(this).attr('bit')));
			}
		});
		newSysConfig['features'] = newFeatureValue;

		return newSysConfig;
	}

	// Public variables

	this.show = function (sysConfig) {
		dialog.modal('show');
		renderSysConfig(sysConfig);

	}

	// Buttons

	$(".header-dialog-save").click(function (e) {
		onSave(convertUIToSysConfig());
	});
}
