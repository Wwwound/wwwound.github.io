var dz_data = {
    'location': [48.48671849723088, 35.62840461730957],
    'general_landing_zone': [
        [48.486237, 35.630385],
        [48.487907, 35.629177],
        [48.488170, 35.629844],
        [48.486449, 35.631102]
    ],
    'tandem_landing_zone': [
        [48.485932, 35.629381],
        [48.486684, 35.628790],
        [48.486813, 35.629229],
        [48.486053, 35.629805]
    ],
    'zones':  {
        'coords': [[
            [48.357088, 35.810172],
            [48.291572, 35.717776],
            [48.331188, 35.617525],
            [48.453867, 35.542352],
            [48.434082, 35.741823]
        ],[
            [48.453867, 35.542352],
            [48.434082, 35.741823],
            [48.567760, 35.630758],
            [48.5356575,35.4954133]
        ]],
        'name': 'UKT814A/B'
    }
}

var config = {
    access_token: 'pk.eyJ1Ijoid3d3b3VuZCIsImEiOiJja2E4OGtxZWQwOXBwMnhwZzV1N3A4YTViIn0.jisawzBklAhA_seTnfVTJQ',

    jumprun_len_km: 1.0,
    jumprun_heading: 40,

    first_part_len_km: 0.500,
    second_part_len_km: 0.500,
    third_part_len_km: 1.5,

    opening_zone_width_km: 0.5,
    ws_opening_zone_width_km: 0.30,
    opening_zone_separation_km: 0.1,
    wind: 0 // @TODO: use wind in calculation
}

class ZonesCalc {

    _radians(degrees)
    {
        var pi = Math.PI;
        return degrees * (pi/180)
    }

    _degrees(radians)
    {
        var pi = Math.PI;
        return radians / (pi/180)
    }

    _getShiftedPosition(pos, heading, len)
    {
        // approximate radius of earth in km
        var R = 6373.0

        var shifted_lon = pos[1] + this._degrees(len * Math.sin(this._radians(heading)) / (R * Math.cos(this._radians(pos[0]))))
        var shifted_lat = pos[0] + this._degrees(len * Math.cos(this._radians(heading)) / R)
        return [shifted_lat, shifted_lon]
    }

    getData(config) {
        var data = {}

        var jumprun_pos = this._getShiftedPosition(
            dz_data['location'],
            config['jumprun_heading'], config['jumprun_len_km']
        )
        data['jumprun_pos'] = jumprun_pos

        // Left turn pattern
        var first_left_turn_pos = this._getShiftedPosition(jumprun_pos, config['jumprun_heading'], config['first_part_len_km'])
        var second_left_turn_pos = this._getShiftedPosition(first_left_turn_pos, config['jumprun_heading'] - 90, config['second_part_len_km'])
        var deploy_left_turn_pos = this._getShiftedPosition(second_left_turn_pos, config['jumprun_heading'] - 180, config['third_part_len_km'])
        data['first_left_turn_pos'] = first_left_turn_pos
        data['second_left_turn_pos'] = second_left_turn_pos
        data['deploy_left_turn_pos'] = deploy_left_turn_pos

        // Right turn pattern
        var first_right_turn_pos = this._getShiftedPosition(jumprun_pos, config['jumprun_heading'], config['first_part_len_km'])
        var second_right_turn_pos = this._getShiftedPosition(first_right_turn_pos, config['jumprun_heading'] + 90, config['second_part_len_km'])
        var deploy_right_turn_pos = this._getShiftedPosition(second_right_turn_pos, config['jumprun_heading'] + 180, config['third_part_len_km'])
        data['first_right_turn_pos'] = first_right_turn_pos
        data['second_right_turn_pos'] = second_right_turn_pos
        data['deploy_right_turn_pos'] = deploy_right_turn_pos

        // General opening zone coordinates
        data['general_opening_zone'] = [
            this._getShiftedPosition(jumprun_pos, config['jumprun_heading'] + 90, config['opening_zone_width_km'] / 2),
            this._getShiftedPosition(dz_data['location'], config['jumprun_heading'] + 90, config['opening_zone_width_km'] / 2),
            this._getShiftedPosition(dz_data['location'], config['jumprun_heading'] - 90, config['opening_zone_width_km'] / 2),
            this._getShiftedPosition(jumprun_pos, config['jumprun_heading'] - 90, config['opening_zone_width_km'] / 2)
        ]

        // WS left pattern opening zone coordinates
        data['ws_left_opening_zone'] = [
            this._getShiftedPosition(
                jumprun_pos, config['jumprun_heading'] - 90,
                config['opening_zone_width_km'] / 2 + config['opening_zone_separation_km']
            ),
            this._getShiftedPosition(
                jumprun_pos, config['jumprun_heading'] - 90,
                config['opening_zone_width_km'] / 2 + config['opening_zone_separation_km'] + config['ws_opening_zone_width_km']
            ),
            this._getShiftedPosition(
                dz_data['location'], config['jumprun_heading'] - 90,
                config['opening_zone_width_km'] / 2 + config['opening_zone_separation_km'] + config['ws_opening_zone_width_km']
            ),
            this._getShiftedPosition(
                dz_data['location'], config['jumprun_heading'] - 90,
                config['opening_zone_width_km'] / 2 + config['opening_zone_separation_km']
            )
        ]

        // WS right pattern opening zone coordinates
        data['ws_right_opening_zone'] = [
            this._getShiftedPosition(
                jumprun_pos, config['jumprun_heading'] + 90,
                config['opening_zone_width_km'] / 2 + config['opening_zone_separation_km']
            ),
            this._getShiftedPosition(
                jumprun_pos, config['jumprun_heading'] + 90,
                config['opening_zone_width_km'] / 2 + config['opening_zone_separation_km'] + config['ws_opening_zone_width_km']
            ),
            this._getShiftedPosition(
                dz_data['location'], config['jumprun_heading'] + 90,
                config['opening_zone_width_km'] / 2 + config['opening_zone_separation_km'] + config['ws_opening_zone_width_km']
            ),
            this._getShiftedPosition(
                dz_data['location'], config['jumprun_heading'] + 90,
                config['opening_zone_width_km'] / 2 + config['opening_zone_separation_km']
            )
        ]

        // WS Performance Lines (shift from center, length)
        /* 270 correctors
        var corrector1 = [0.0, -0.50];
        var corrector2 = [0, 0.225];
        var corrector3 = [0, 0];
        var corrector4 = [0.05, 0.358];
        var corrector5 = [0.055, -0.37];
        */

        /* 60 corrector
        var corrector1 = [0.175-0.085, 0.99];
        var corrector2 = [0.085, 0.94];
        var corrector3 = [0.015, 0.91];
        var corrector4 = [0.0, 1.21];
        var corrector5 = [0.02, 1.79];
        */

        var corrector1 = [-0.215+0.155, 1.37];
        var corrector2 = [0.05, 1.24];
        var corrector3 = [-0.155, 0.93];
        var corrector4 = [0.225, 1.25];
        var corrector5 = [0.09, 1.1];

        var perf_lines5_pos = this._getShiftedPosition(dz_data['location'], config['jumprun_heading'], 4.0);
        var perf_lines4_pos = this._getShiftedPosition(dz_data['location'], config['jumprun_heading'], 3.0);
        var perf_lines3_pos = this._getShiftedPosition(dz_data['location'], config['jumprun_heading'], 2.0);

        data['performance_lines'] = [
            // line1
            [
                this._getShiftedPosition(
                    perf_lines5_pos,
                    config['jumprun_heading'] + 90,
                    0.6*2 + corrector1[0] + corrector2[0]
                ),
                this._getShiftedPosition(
                    this._getShiftedPosition(
                        dz_data['location'], config['jumprun_heading'] + 90,
                        0.6*2 + corrector1[0] + corrector2[0]
                    ),
                    config['jumprun_heading']+180,
                    corrector1[1]
                )
            ],
            // line2
            [
                this._getShiftedPosition(
                    perf_lines5_pos,
                    config['jumprun_heading'] + 90,
                    0.6 + corrector2[0]
                ),
                this._getShiftedPosition(
                    this._getShiftedPosition(
                        dz_data['location'], config['jumprun_heading'] + 90,
                        0.6 + corrector2[0]
                    ),
                    config['jumprun_heading']+180,
                    corrector2[1]
                )
            ],
            // line3
            [
                this._getShiftedPosition(
                    perf_lines5_pos,
                    config['jumprun_heading'] + 90,
                    0.0 + corrector3[0]
                ),
                this._getShiftedPosition(
                    this._getShiftedPosition(
                        dz_data['location'], config['jumprun_heading'] + 90,
                        0.0 + corrector3[0]
                    ),
                    config['jumprun_heading']+180,
                    corrector3[1]
                )
//                this._getShiftedPosition(dz_data['location'], config['jumprun_heading']-90, corrector3[1])
            ],
            // line4
            [
                this._getShiftedPosition(
                    perf_lines5_pos,
                    config['jumprun_heading']-90,
                    0.6 + corrector4[0]
                ),
                this._getShiftedPosition(
                    this._getShiftedPosition(
                        dz_data['location'], config['jumprun_heading']-90,
                        0.6 + corrector4[0]
                    ),
                    config['jumprun_heading']+180,
                    corrector4[1]
                )
            ],
            // line5
            [
                this._getShiftedPosition(
                    perf_lines5_pos,
                    config['jumprun_heading'] - 90,
                    0.6*2 + corrector4[0] + corrector5[0]
                ),
                this._getShiftedPosition(
                    this._getShiftedPosition(
                        dz_data['location'], config['jumprun_heading'] - 90,
                        0.6*2 + corrector4[0] + corrector5[0]
                    ),
                    config['jumprun_heading']+180,
                    corrector5[1]
                )
            ]
        ]
        data['performance_jumpruns'] = [
            [
                this._getShiftedPosition(
                    perf_lines5_pos,
                    config['jumprun_heading'] + 90,
                    2.1 + corrector1[0] + corrector2[0]
                ),
                this._getShiftedPosition(
                    perf_lines5_pos,
                    config['jumprun_heading'] - 90,
                    1.2 + corrector4[0] + corrector5[0]
                )
            ],
            [
                this._getShiftedPosition(
                    perf_lines4_pos,
                    config['jumprun_heading'] + 90,
                    2.1 + corrector1[0] + corrector2[0]
                ),
                this._getShiftedPosition(
                    perf_lines4_pos,
                    config['jumprun_heading'] - 90,
                    1.2 + corrector4[0] + corrector5[0]
                )
            ],
            [
                this._getShiftedPosition(
                    perf_lines3_pos,
                    config['jumprun_heading'] + 90,
                    2.1 + corrector1[0] + corrector2[0]
                ),
                this._getShiftedPosition(
                    perf_lines3_pos,
                    config['jumprun_heading'] - 90,
                    1.2 + corrector4[0] + corrector5[0]
                )
            ],
        ]

        return data
    }

}