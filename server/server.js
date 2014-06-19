/* server stuff */
Meteor.publish('C2Workouts', function () {
    return C2Workouts.find();
});

Meteor.methods({
    storeC2Workouts: function (data) {
        // for now only csv export from Concept2 Utility - Version 6.55 are supported
        data.results.forEach(function (sp) {
            // skip if
            // a) first cell contains text
            // b) second cell is 'Name'
            // c) sixth cell is 'Total Workout Results'
            if (sp[0] || sp[1] === 'Name' || sp[5] === 'Total Workout Results') {
                return;
            }

            // Logcard exports are really messy - workouts and splits are mixed in the same table, hence
            // we need some more logic to split workouts, splits, and rest intervals
            if (sp[5]) // this entry is an actual workout
            {
                var timestamp = createTimestamp(sp[2], sp[3]);
                console.log('Importing a workout from ' + timestamp);
                if (C2Workouts.findOne({name: sp[1], date: sp[2], timeofday: sp[3]})) {
                    console.log('duplicate workout found - will overwrite');
                    var workoutId = C2Workouts.findOne({name: sp[1], date: sp[2], timeofday: sp[3]})._id
                    // in order to maintain integrity of splits we need to delete rather than update the workout
                    C2Workouts.remove({"_id": workoutId});
                }
                var workout = {
                    timestamp: timestamp,
                    name: sp[1],
                    date: sp[2],
                    timeofday: sp[3],
                    desc: sp[4],
                    totalTime: timeToSeconds(sp[5]),
                    totalMeters: sp[6],
                    totalSPM: sp[7],
                    totalHR: sp[8],
                    calcPace500: timeToSeconds(sp[13]),
                    calcCalH: sp[14],
                    calcWatt: sp[15],
                };
                C2Workouts.insert(workout);
            }

            else // this entry is a split
            {
                console.log('Importing a split');
                if (sp[16]) {
                    var type = 'interval rest';
                }
                else {
                    var type = 'split';
                }
                var split = {
                    type: type,
                    splitTime: timeToSeconds(sp[9]),
                    splitMeters: sp[10],
                    splitSPM: sp[11],
                    splitHR: sp[12],
                    calcPace500: timeToSeconds(sp[13]),
                    calcCalH: sp[14],
                    calcWatt: sp[15],
                    restIntervalTime: timeToSeconds(sp[16]),
                    restIntervalMeters: sp[17],
                    restIntervalHR: sp[18],
                };
                var workoutId = C2Workouts.findOne({name: sp[1], date: sp[2], timeofday: sp[3]})._id;
                C2Workouts.update({ _id: workoutId }, {$push: {split: split}});
            }
        })
    }
});

