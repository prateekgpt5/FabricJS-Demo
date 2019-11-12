(function () {

    var module = angular.module('FabricJSDemo', []).controller('appCtrl', function ($scope, $http, $timeout) {
        $scope.showCanvas = false;
        $scope.jsonData = {};
        var canvas1, canvas2;
        var webgl1, webgl2;
        $scope.jsonDataforCanvas = function () {
            $http.get('https://jsonplaceholder.typicode.com/photos')
                .then(function (response) {
                    $scope.jsonData = response.data;
                    console.log("status:" + response.status);
                }).catch(function (response) {
                    console.error('Error occurred:', response.status, response.data);
                }).finally(function () {
                    console.log("Task Finished.");
                });
        }

        $scope.generateCanvas = function () {
            $scope.showCanvas = true;
            $scope.jsonDataforCanvas();
            canvas1 = new fabric.Canvas('canvas1', { width: 600, height: 400 });
            canvas2 = new fabric.Canvas('canvas2', { width: 600, height: 400 });
        }

        $scope.insertIntoCanvas = function (selectedCanvas, selectedObject) {
            if (selectedCanvas == null) {
                alert("Please select a canvas to render the object.");
            }
            if (selectedObject == null) {
                alert("Please select a object to render on the canvas.");
            }
            console.log("Selected Canvas : " + selectedCanvas);
            console.log("Selected Object : " + selectedObject);

            var object = $scope.jsonData.filter(function (data) {
                return data.id == selectedObject;
            });
            console.log(object[0]);

            if (parseInt(object[0].id) % 2 != 0 && parseInt(object[0].albumId) < 100) {
                console.log("ID is odd : " + object[0].thumbnailUrl);

                fabric.Image.fromURL(object[0].thumbnailUrl, function (image) {
                    // added cross-origin parameter for image
                    image.crossOrigin = "Anonymous";

                    var img1 = image.set({ left: 100, top: 100, width: 250, height: 250 });
                    if (selectedCanvas == "canvas1")
                        canvas1.add(img1);
                    else if (selectedCanvas == "canvas2")
                        canvas2.add(img1);
                });
            } else if (parseInt(object[0].id) % 2 == 0 && parseInt(object[0].albumId) < 100) {
                console.log("ID is even : " + object[0].title);

                var titleText = new fabric.Text(object[0].title, { fontFamily: 'Comic Sans', left: 100, top: 100 });
                if (selectedCanvas == "canvas1")
                    canvas1.add(titleText);
                else if (selectedCanvas == "canvas2")
                    canvas2.add(titleText);
            } else if (parseInt(object[0].albumId) >= 0) {
                console.log("Album ID is greater than 100 : " + object[0].url);

                var urlText = new fabric.Text(object[0].title, { fontFamily: 'Comic Sans', left: 100, top: 100 });
                if (selectedCanvas == "canvas1")
                    canvas1.add(urlText);
                else if (selectedCanvas == "canvas2")
                    canvas2.add(urlText);
            }
        }

        $(document).ready(function () {
            var activeObject, initialCanvas;

            canvas1.on('mouse:down', function () {
                if (this.getActiveObject()) {
                    // activeObject = $.extend({}, this.getActiveObject());
                    // initialCanvas = this.lowerCanvasEl.id;
                    // canvas1.moveTo(activeObject, 10);
                    // canvas2.moveTo(activeObject, 10);
                    // activeObject.moveTo(11);

                    cloneObject();
                }
            });

            function cloneObject() {
                var object = canvas1.getActiveObject();
                var mycopy = fabric.util.object.clone(object);

                canvas2.add(mycopy);
                canvas2.renderAll()
                canvas1.renderAll();

            }
        });
    });
})();