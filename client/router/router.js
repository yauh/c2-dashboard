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
        path: '/'
    });
    this.route('logcard', {
        path: '/logcard',
    });
});