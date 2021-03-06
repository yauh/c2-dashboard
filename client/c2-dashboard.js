// virtual client collection(tm)
WorkoutsByDay = new Meteor.Collection('workoutsbyday');
myRowWorkouts = null;


Router.onBeforeAction(function(pause){
    console.log('ready?', this.ready());
    this.subscribe('Workouts').wait();
    this.subscribe( "AggregatedWorkouts").wait();
    if (this.ready()){
    myRowWorkouts = Workouts.find({name: 'Stepha', workouttype: 'rowing'}, {sort: {timestamp: -1}, date: 1, timeofday: 1, timestamp: 1, desc: 1, totalHR: 1, totalMeters: 1, totalSPM: 1, totalTime: 1});
    }
    });




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
Template.personalCharts.rendered = function () {
        // TODO: There must be a more clever way to create data object.
        // TODO: Multiple workouts per day must be aggregated
        var myRowWorkouts = this.data.myRowWorkouts;
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
        console.log(myRowWorkouts.fetch());
        myRowWorkouts.forEach(function(doc){
            var dataTime = [doc['totalTime']];
            chartDataSeries[0].data.push(dataTime);
            var dataMeters = [doc['totalMeters']];
            chartDataSeries[1].data.push(dataMeters);
        });

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
;


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


renderSplitChart = function(id) {
    var splitData = Workouts.findOne({_id: id});
    var seriesCategories = [];
    var seriesData = [];
    seriesData[0] = [];
    seriesData[1] = [];
    var splitCount = 0;
    console.log('found ' + splitData.split.length + ' splits');
    splitData.split.forEach(function(split) {
        splitCount++;
        seriesCategories.push(splitCount);
        seriesData[0].push(split.splitMeters);
        seriesData[1].push(split.calcPace500);
    });
    $('#splitChart').highcharts({
        chart: {
            zoomType: 'xy'
        },
        title: {
            text: 'Workout splits'
        },
        subtitle: {
            text: 'Look how well you rowed'
        },
        xAxis: [{
            categories: seriesCategories
        }],
        yAxis: [{ // Secondary yAxis
            gridLineWidth: 0,
            title: {
                text: 'Distance',
                style: {
                    color: Highcharts.getOptions().colors[0]
                }
            },
            labels: {
                format: '{value}m',
                style: {
                    color: Highcharts.getOptions().colors[0]
                }
            }

        }, { // Tertiary yAxis
            gridLineWidth: 0,
            title: {
                text: 'Pace',
                style: {
                    color: Highcharts.getOptions().colors[1]
                }
            },
            labels: {
                formatter: function () {
                    var m = Math.floor(this.value / 60) % 60;
                    var s = this.value % 60;
                    if (m < 9) m = "0" + m;
                    if (s < 9) s = "0" + s;
                    return [m, s].join(':');
                },
                style: {
                    color: Highcharts.getOptions().colors[1]
                }
            },
            opposite: true
        }],
        tooltip: {
            shared: true
        },
        legend: {
            layout: 'vertical',
            align: 'left',
            x: 120,
            verticalAlign: 'top',
            y: 80,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
        },
        series: [{
            name: 'Distance',
            type: 'column',
            yAxis: 0,
            data: seriesData[0],
            tooltip: {
                valueSuffix: ' m'
            }

        }, {
            name: 'Pace',
            type: 'spline',
            yAxis: 1,
            data: seriesData[1],
            marker: {
                enabled: false
            },
            dashStyle: 'shortdot',
            tooltip: { // TODO: Why u no work as on the axis?
                formatter: function () {
                    var m = Math.floor(this.value / 60) % 60;
                    var s = this.value % 60;
                    if (m < 9) m = "0" + m;
                    if (s < 9) s = "0" + s;
                    return [m, s].join(':');
                }
            }

        }]
    });
}
