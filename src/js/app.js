(function () {

    var module = angular.module('FabricJSDemo', []).controller('appCtrl', function ($scope, $http, $timeout) {
        $scope.showCanvas = false;
        $scope.jsonData = {};
        var canvas1, canvas2;

        // Get Data from the given URL
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

        // Generate Canvas
        $scope.generateCanvas = function () {
            $scope.showCanvas = true;
            $scope.jsonDataforCanvas();
            canvas1 = new fabric.Canvas('canvas1', { width: 600, height: 400 });
            canvas2 = new fabric.Canvas('canvas2', { width: 600, height: 400 });
        }

        // Insert Object into the Canvas
        $scope.insertIntoCanvas = function (selectedCanvas, selectedObject) {
            var object = [];
            if (selectedCanvas == null) {
                alert("Please select a canvas to render the object.");
            }
            if (selectedObject == null) {
                alert("Please select a object to render on the canvas.");
            }
            console.log("Selected Canvas : " + selectedCanvas);
            console.log("Selected Object : " + selectedObject);

            if (selectedObject == "first") {
                object.push($scope.jsonData[0]);
                object.push($scope.jsonData[1]);
            } else if (selectedObject == "last") {
                object.push($scope.jsonData[$scope.jsonData.length - 1]);
                object.push($scope.jsonData[$scope.jsonData.length - 2]);
            } else if (selectedObject == "random") {
                var randomNumber = Math.floor((Math.random() * 5000) + 1);
                console.log("Random Number : " + randomNumber);
                object.push($scope.jsonData[randomNumber]);
            }

            console.log(object);
            for (var i = 0; i < object.length; i++) {

                if (parseInt(object[i].id) % 2 != 0 && parseInt(object[i].albumId) < 100) {
                    console.log("ID is odd : " + object[i].thumbnailUrl);

                    fabric.Image.fromURL(object[i].thumbnailUrl, function (image) {
                        // added cross-origin parameter for image
                        image.crossOrigin = "Anonymous";

                        var img1 = image.set({ left: 100, top: 100, width: 100, height: 100 });
                        if (selectedCanvas == "canvas1")
                            canvas1.add(img1);
                        else if (selectedCanvas == "canvas2")
                            canvas2.add(img1);
                    });
                } else if (parseInt(object[i].id) % 2 == 0 && parseInt(object[i].albumId) < 100) {
                    console.log("ID is even : " + object[i].title);

                    var titleText = new fabric.Text(object[i].title, { fontFamily: 'Comic Sans', fontSize: 20, color: 'black', left: 100, top: 100 });
                    if (selectedCanvas == "canvas1")
                        canvas1.add(titleText);
                    else if (selectedCanvas == "canvas2")
                        canvas2.add(titleText);
                } else if (parseInt(object[i].albumId) >= 0) {
                    console.log("Album ID is greater than 100 : " + object[i].url);

                    var urlText = new fabric.Text(object[i].title, { fontFamily: 'Comic Sans', fontSize: 20, color: 'black', left: 100, top: 100 });
                    if (selectedCanvas == "canvas1")
                        canvas1.add(urlText);
                    else if (selectedCanvas == "canvas2")
                        canvas2.add(urlText);
                }

            }
            if ($scope.isCanvasBlank(document.getElementById('canvas1')) && $scope.isCanvasBlank(document.getElementById('canvas2'))) {
                canvas1.on("object:moving", $scope.onObjectMoving);
                canvas2.on("object:moving", $scope.onObjectMoving);
            }
        }

        // Object Moving Listener
        $scope.onObjectMoving = function (p) {
            var viewport = p.target.canvas.calcViewportBoundaries();

            if (p.target.canvas === canvas1) {
                if (p.target.left > viewport.br.x) {
                    console.log("Migrate: left -> center");
                    $scope.migrateItem(canvas1, canvas2, p.target);
                    return;
                }
            }
            if (p.target.canvas === canvas2) {
                if (p.target.left < viewport.tl.x) {
                    console.log("Migrate: center -> left");
                    $scope.migrateItem(canvas2, canvas1, p.target);
                    return;
                }
            }
        }

        $scope.migrateItem = function (fromCanvas, toCanvas, pendingImage) {
            // Just drop image from old canvas
            fromCanvas.remove(pendingImage);

            // We're going to trick fabric.js,
            // so we keep internal transforms of the source canvas, 
            // in order to inject it into destination canvas.
            pendingTransform = fromCanvas._currentTransform;
            fromCanvas._currentTransform = null;

            // Make shortcuts for fabric.util.removeListener and fabric.util.addListener
            var removeListener = fabric.util.removeListener;
            var addListener = fabric.util.addListener;

            // Re-arrange subscriptions for source canvas
            {
                removeListener(fabric.document, 'mouseup', fromCanvas._onMouseUp);
                removeListener(fabric.document, 'touchend', fromCanvas._onMouseUp);

                removeListener(fabric.document, 'mousemove', fromCanvas._onMouseMove);
                removeListener(fabric.document, 'touchmove', fromCanvas._onMouseMove);

                addListener(fromCanvas.upperCanvasEl, 'mousemove', fromCanvas._onMouseMove);
                addListener(fromCanvas.upperCanvasEl, 'touchmove', fromCanvas._onMouseMove, {
                    passive: false
                });

                // Wait 500ms before rebinding mousedown to prevent double triggers
                // from touch devices
                var _this = fromCanvas;
                setTimeout(function () {
                    addListener(_this.upperCanvasEl, 'mousedown', _this._onMouseDown);
                }, 500);
            }

            // Re-arrange subscriptions for destination canvas
            {
                addListener(fabric.document, 'touchend', toCanvas._onMouseUp, {
                    passive: false
                });
                addListener(fabric.document, 'touchmove', toCanvas._onMouseMove, {
                    passive: false
                });

                removeListener(toCanvas.upperCanvasEl, 'mousemove', toCanvas._onMouseMove);
                removeListener(toCanvas.upperCanvasEl, 'touchmove', toCanvas._onMouseMove);

                addListener(fabric.document, 'mouseup', toCanvas._onMouseUp);
                addListener(fabric.document, 'mousemove', toCanvas._onMouseMove);
            }

            // We need this timer, because we want Fabric.js to complete pending render
            // before we inject, because it causes some unpleasant image jumping.
            $timeout(function () {
                // Add image to destination canvas,
                pendingImage.canvas = toCanvas;
                pendingImage.migrated = true;
                toCanvas.add(pendingImage);

                // and inject transforms from source canvas
                toCanvas._currentTransform = pendingTransform;

                // finally don't forget to make pasted object selected
                toCanvas.setActiveObject(pendingImage);
            }, 10);
        };

        //Check for the Canvas is blank or not
        $scope.isCanvasBlank = function (canvasElement) {
            var blank = document.createElement('canvas');
            blank.width = canvasElement.width;
            blank.height = canvasElement.height;
            return canvasElement.toDataURL() == blank.toDataURL();
        }
    });
})();