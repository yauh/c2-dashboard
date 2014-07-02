Router.configure({
    layoutTemplate: 'main'
});

Router.map( function () {
    this.route('home', {
        path: '/',
    });
    this.route('about', {
        path: '/about'
    });
    this.route('upload', {
        path: '/upload',
        template: 'uploadCsv',
    });
    this.route('dashboard', {
        path: '/dashboard',
        data: function(){
            return {myRowWorkouts: Workouts.find({name: 'Stepha', workouttype: 'rowing'}, {sort: {timestamp: -1}, date: 1, timeofday: 1, timestamp: 1, desc: 1, totalHR: 1, totalMeters: 1, totalSPM: 1, totalTime: 1})};
        }
    });
    this.route('logcard', {
        path: '/logcard',
    });
});