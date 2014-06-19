Meteor.subscribe('C2Workouts');

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
                    Meteor.call('storeC2Workouts', all);
                }
                reader.readAsText(file);
            }
        }
    }
})

// populate logcard workouts
Template.logcard.workout = function () {
    return C2Workouts.find();
}

/* helpful functions */

csvToJson = function (csv) {
    var parseConfig = {
        delimiter: ";",
        header: false
    };
    var json = $.parse(csv, parseConfig);
    return json;
}
