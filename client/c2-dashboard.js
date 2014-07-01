
Meteor.subscribe( "Workouts", function() {
    console.log( "All workouts have been updated" );
});
myRowWorkouts = Workouts.find({name: 'Stepha', workouttype: 'rowing'}, {sort: {timestamp: -1}, date: 1, timeofday: 1, timestamp: 1, desc: 1, totalHR: 1, totalMeters: 1, totalSPM: 1, totalTime: 1});
console.log('found ' + myRowWorkouts.count() + ' workouts');


// uploading csv logcard data
// instantly triggers processing when a file is selected
Template.uploadCsv.events({
    "change #files": function (e) {
        var files = e.target.files || e.dataTransfer.files;
        for (var i = 0, file; file = files[i]; i++) {
            if (file.type.indexOf("text") == 0) {
                var reader = new FileReader();
                reader.onloadend = function (e) {
                    var all = csvToJson(e.target.result);
                    // storing happens only on server side
                    // TODO: Probably more effective to not parse file in browser but on server instead
                    Meteor.call('storeWorkouts', all);
                }
                reader.readAsText(file);
            }
        }
    }
});

// create simple chart to show rowing distances by date
// TODO: Chart will not get rendered if navigating back to dashboard
Template.personalCharts.helpers({
    myChart: function () {
            // TODO: There must be a more clever way to create data object.
        // TODO: Multiple workouts per day must be aggregated
        var chartDataSeries = [];
        chartDataSeries[0] = {};
        chartDataSeries[0].name = "Time";
        chartDataSeries[0].type = "column";
        chartDataSeries[0].data = [];
        chartDataSeries[1] = {};
        chartDataSeries[1].name = "Distance";
        chartDataSeries[1].type = "spline";
        chartDataSeries[1].yAxis = 1;
        chartDataSeries[1].data = [];
        for (var i = 0; i < myRowWorkouts.count(); i++) {
            var dataTime = [myRowWorkouts.db_objects[i]['totalTime']];
            chartDataSeries[0].data.push(dataTime);
            var dataMeters = [myRowWorkouts.db_objects[i]['totalMeters']];
            chartDataSeries[1].data.push(dataMeters);
        }

        // render a pretty chart
        $('#totalTimesChart').highcharts({
            chart: {
                type: 'column'
            },
            title: {
                text: 'Total rowing times'
            },
            xAxis: {
                type: 'datetime',
                dateTimeLabelFormats: { // don't display the dummy year
                    month: '%e. %b',
                    year: '%b'
                },
            },
            yAxis: [
                { // Primary yAxis
                    labels: {
                        formatter: function () {
                            var h = Math.floor(this.value / 3600);
                            var m = Math.floor(this.value / 60) % 60;
                            var s = this.value % 60;
                            if (h < 9) h = "0" + h;
                            if (m < 9) m = "0" + m;
                            if (s < 9) s = "0" + s;
                            return [h, m, s].join(':');
                        }
                    },
                    type: 'datetime',
                    tooltip: {// TODO: show seconds in hms formats
                        enabled: true,
                        formatter: function () {
                            var h = Math.floor(this.value / 3600);
                            var m = Math.floor(this.value / 60) % 60;
                            var s = this.value % 60;
                            if (h < 9) h = "0" + h;
                            if (m < 9) m = "0" + m;
                            if (s < 9) s = "0" + s;
                            return [h, m, s].join(':');
                        }
                    },
                    title: {
                        text: 'Duration',
                        style: {
                            color: Highcharts.getOptions().colors[1]
                        }
                    },
                    min: 0,
                },
                { // Secondary yAxis
                    title: {
                        text: 'Distance'
                    },
                    opposite: true,
                    min: 0,
                }
            ],
            plotOptions: {
                series: {
                    pointStart: new Date().getTime(),
                    pointInterval: 60 * 1000 // one minute
                }
            },
            series: chartDataSeries
        });
    }

});


// populate logcard workouts
Template.logcard.workouts = function () {
    return Workouts.find();
};

Template.splitModal.workout = function () {
    console.log("Let's have a look at id " + Session.get("selectedWorkout"))
    return Workouts.findOne({_id: Session.get("selectedWorkout")});
};

Template.logcard.events({
    'click .delete': function (evt) {
        var id = $(evt.currentTarget).attr('data-id');
        if (confirm("Are you sure?")) {
            console.log('delete', id);
            Meteor.call('removeWorkout', id);
        }
    },
    'click #details': function (evt) {
        var id = $(evt.currentTarget).attr('data-id');
        Session.set("selectedWorkout", id);
        $('#workoutDetails').modal('show');
        renderSplitChart(id);
    }
});

/* helpful functions */
csvToJson = function (csv) {
    var parseConfig = {
        delimiter: ";",
        header: false
    };
    var json = $.parse(csv, parseConfig);
    return json;
}

UI.registerHelper('toHms', function (seconds, err) {
    if (seconds){
        return moment.duration(seconds*1000).format();
    }
});

renderSplitChart = function(id) {
    console.log('This is a split chart for id ' + id);
    return id;
}
