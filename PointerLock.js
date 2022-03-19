var camera, scene, renderer, controls;


			var controlsEnabled = true;

			var moveForward = false;
			var moveBackward = false;
			var moveLeft = false;
			var moveRight = false;

			var prevTime = performance.now();
			var velocity = new THREE.Vector3();
			var direction = new THREE.Vector3();
			var color = new THREE.Color();


			function init() {

				var ratio = window.innerWidth/window.innerHeight;
				camera = new THREE.PerspectiveCamera(45,ratio,0.00001,1000);
		    	var Pos = new THREE.Vector3(0,0,0);
		    	camera.position.set(Pos.x,Pos.y,Pos.z);
		    	var Dir = new THREE.Vector3(0,0,1);
		    	camera.lookAt(Dir.x,Dir.y,Dir.z);

				scene = new THREE.Scene();

				controls = new THREE.PointerLockControls( camera );

        		controls.enabled = true;
				scene.add( controls.getObject() );

				var onKeyDown = function ( event ) {

					switch ( event.keyCode ) {

						case 38: // up
						case 87: // w
							moveForward = true;
							break;

						case 37: // left
						case 65: // a
							moveLeft = true;
              break;

						case 40: // down
						case 83: // s
							moveBackward = true;
							break;

						case 39: // right
						case 68: // d
							moveRight = true;
							break;

					}

				};

				var onKeyUp = function ( event ) {

					switch( event.keyCode ) {

						case 38: // up
						case 87: // w
							moveForward = false;
							break;

						case 37: // left
						case 65: // a
							moveLeft = false;
							break;

						case 40: // down
						case 83: // s
							moveBackward = false;
							break;

						case 39: // right
						case 68: // d
							moveRight = false;
							break;

					}
				};

				document.addEventListener( 'keydown', onKeyDown, false );
				document.addEventListener( 'keyup', onKeyUp, false );

				//Box Material & Misc Renderer Stuff
				{
					var material_box = new THREE.MeshBasicMaterial();
					material_box.color=  new THREE.Color(1,0,0);
					material_box.wireframe=true;
					var geometry_box = new THREE.BoxGeometry(100,0.1,100,32,1,32);
	
					var BoxMesh = new THREE.Mesh(geometry_box,material_box);
					//BoxMesh.position.y=-0.1;
					scene.add(BoxMesh);
	
					renderer = new THREE.WebGLRenderer( { antialias: true } );
					renderer.setPixelRatio( window.devicePixelRatio );
					renderer.setSize( window.innerWidth, window.innerHeight );
					document.body.appendChild( renderer.domElement );
	
					window.addEventListener( 'resize', onWindowResize, false );
				}

			}

			function onWindowResize() {
				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();
				renderer.setSize( window.innerWidth, window.innerHeight );
			}
			init();
			animate();


			
			function animate() {

				requestAnimationFrame( animate );

				if ( controlsEnabled == true ) {

				 var time = performance.now();
					var delta =  ( time - prevTime ) / 1000;

					velocity.x -= velocity.x * 10.0 * delta;
					velocity.z -= velocity.z * 10.0 * delta;

					direction.z = Number( moveForward ) - Number( moveBackward );
					direction.x = Number( moveLeft ) - Number( moveRight );
					direction.normalize();

					if ( moveForward || moveBackward ) velocity.z -= direction.z * 400.0 * delta;
					if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;

					controls.getObject().translateX( velocity.x * delta );
					controls.getObject().translateZ( velocity.z * delta );

					prevTime = time;

				}

				renderer.render( scene, camera );

			}