UI.registerHelper('toHms', function (seconds, err) {
    if (seconds){
        return moment.duration(seconds, "seconds").format("d[d] h:mm:ss");
    }
});