/* publications */
Meteor.publish("Workouts", function () {
    console.log('publish ' + Workouts.find().count() + ' workouts in sum');
    return Workouts.find({owner: this.userId});
});


var WorkoutTypes = {'running': ['500m', '1000m', '2000m', '5000m', '10000m', '21097m', '42195m', '00:04:00', '00:30:00', '01:00:00', 'Interval', 'other']};

// some stats
console.log('Number of workouts: ' + Workouts.find().count());
//console.log('Number of workout types: ' + C2Workouts.distinct('desc').length);
// should turn up the same number as the previous
console.log('Number of workouts types for Stepha: ' + Workouts.aggregate(
    {"$match": {"name": "Stepha"}}, // hardcode my name for now
    {"$group": {"_id": "$desc", "sum": {"$sum": 1}}}
).length
);


/* methods */
Meteor.methods({
    storeWorkouts: function (data) {
        console.log('this is storeWorkouts in action');
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
            if (sp[5]) // this entry seems to be an actual workout
            {
                var timestamp = createTimestamp(sp[2], sp[3]);
                console.log('Importing a workout from ' + timestamp + ' for ' + sp[1] + '[' + Meteor.userId() + ']');
                if (Workouts.findOne({owner: Meteor.userId(), name: sp[1], date: sp[2], timeofday: sp[3]})) {
                    console.log('duplicate workout found - will overwrite');
                    var workoutId = Workouts.findOne({owner: Meteor.userId(), name: sp[1], date: sp[2], timeofday: sp[3]})._id
                    // in order to maintain integrity of splits we need to delete rather than update the workout
                    Workouts.remove({"_id": workoutId});
                }
                //console.log(this.userId + Meteor.userId);
                var workouttype = 'rowing';
                var workout = {
                    owner: Meteor.userId(),
                    workouttype: workouttype,
                    added: new Date().getTime(),
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
                    totalCalories: calculateCalories(timeToSeconds(sp[5]),sp[14] )
                };
                Workouts.insert(workout);
            }

            else // this entry is a split
            {
                console.log('Importing a split');
                if (sp[16]) {
                    var type = 'rest';
                }
                else {
                    var type = 'split';
                }
                var workoutSplit = {
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
                var workoutId = Workouts.findOne({owner: Meteor.userId(), name: sp[1], date: sp[2], timeofday: sp[3]})._id;
                Workouts.update({ _id: workoutId }, {$push: {'split': workoutSplit}});
            }
        })
    console.log('done storeWorkouts');
    },
    removeWorkout: function (id) {
         console.log('remove ' + id);
         Workouts.remove({_id: id}); // TODO: add some validation
    }
});

/* helpful functions */
