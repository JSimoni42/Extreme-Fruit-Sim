'use strict';

Physijs.scripts.worker = 'js/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

var init, initEngine, initLights, initObjects, initScene, initGUI, initEventHandling;

var render;

var gui;
var power = 50;
var resetAll;
var spawnFruit, spawnBulb, spawnHammer, spawnPieces, spawnDecal;
var createTower;

var model_loader, texture_loader, decal_loader;

var container, renderer, render_stats, physics_stats;

var scene;
var lights = {};
var lighton = true;
var camera;

var floor, ceiling, wall1, wall2, wall3, wall4;
var table, melon, bulb, hammer;
var allFruits = [];
var fruitCounter = 0;
var pickable_objects = [];
var fruit_pieces = [];
var hammer_hitting = false;

var decals = [];
var meshToIntersect;
var position = new THREE.Vector3( 0, 0, 0 );
var direction = new THREE.Vector3( 0, 0, 0 );
var dimensions = new THREE.Vector3( 10, 10, 10 );
var check = new THREE.Vector3( 1, 1, 1 );

var camX = 0;
var camY = 50;
var camZ = 100;
var camLookX = 0;
var camLookY = 0;
var camLookZ = 0;

var lightX = -35;
var lightY = 20;
var lightZ = 0;

var floor_material, wall_material, table_material, hammer_material, melon_material, bulb_material;

var intersect_plane;
var selected_obj = null;
var mouse_position = new THREE.Vector3;

var _i;
var _v3 = new THREE.Vector3;

var spawnGnats;
var gnats = [];

initEngine = function() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMapSoft = true;
    document.getElementById( 'viewport' ).appendChild( renderer.domElement );

    render_stats = new Stats();
    render_stats.domElement.style.position = 'absolute';
    render_stats.domElement.style.bottom = '49px';
    render_stats.domElement.style.zIndex = 100;
    document.getElementById('viewport').appendChild(render_stats.domElement);

    physics_stats = new Stats();
    physics_stats.domElement.style.position = 'absolute';
    physics_stats.domElement.style.bottom = '0px';
    physics_stats.domElement.style.zIndex = 100;
    document.getElementById('viewport').appendChild(physics_stats.domElement);

    scene = new Physijs.Scene({fixedTimeStep: 1 / 120});
    scene.setGravity(new THREE.Vector3( 0, -150, 0 ));
    scene.addEventListener(
        'update',
        function() {
            if ( selected_obj !== null ) {

                _v3.copy(mouse_position).sub(selected_obj.position).multiplyScalar( 5 );
                _v3.y = 0;
                selected_obj.setLinearVelocity( _v3 );

                /* _v3.set(0, 0, 0);
                for ( _i = 0; _i < pickable_objects.length; _i++ ) {
                    pickable_objects[_i].applyCentralImpulse( _v3 );
                } */
            }
            scene.simulate( undefined, 1 );
            physics_stats.update();
        }
    );
    camera = new THREE.PerspectiveCamera(
        35,
        window.innerWidth / window.innerHeight,
        1,
        1000
    );
    camera.position.set( camX, camY, camZ );
    camera.lookAt(new THREE.Vector3(camLookX, camLookY, camLookZ));
    scene.add(camera);
};

initLights = function() {
    // ambient light
    lights.am_light = new THREE.AmbientLight( 0x444444 );
    scene.add(lights.am_light);

    // directional light
    lights.point_light = new THREE.PointLight( 0xFFFFFF );
    lights.point_light.position.set(lightX, (lightY + 5), lightZ);
    //lights.dir_light.target.position.copy(scene.position);
    lights.point_light.castShadow = true;
    lights.point_light.shadowCameraLeft = -30;
    lights.point_light.shadowCameraTop = -30;
    lights.point_light.shadowCameraRight = 30;
    lights.point_light.shadowCameraBottom = 30;
    lights.point_light.shadowCameraNear = 20;
    lights.point_light.shadowCameraFar = 200;
    lights.point_light.shadowBias = -.001
    lights.point_light.shadowMapWidth = lights.point_light.shadowMapHeight = 2048;
    lights.point_light.shadowDarkness = .75;
    scene.add(lights.point_light);
};

initObjects = function() {
    texture_loader = new THREE.TextureLoader();

    floor_material = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ map: texture_loader.load( 'images/cinderblock.jpg' )}),
        .9, // high friction
        .2 // low restitution
    );
    floor_material.map.wrapS = THREE.RepeatWrapping;
    floor_material.map.wrapT = THREE.RepeatWrapping;
    floor_material.map.repeat.set(20, 20);

    var wallTex = texture_loader.load("images/cinderblock.jpg");
    wall_material = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ map: wallTex}),
        .9, // high friction
        .2 // low restitution
    );
    wall_material.map.wrapS = THREE.RepeatWrapping;
    wall_material.map.wrapT = THREE.RepeatWrapping;
    wall_material.map.repeat.set(3, 3);

    wall_material.bumpMap = wallTex;
    wall_material.bumpScale = 0.2;


    var tableTex = texture_loader.load("images/wood2.jpg");
    table_material = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ map: tableTex}),
        .9, // high friction
        .2 // low restitution
    );
    table_material.map.wrapS = THREE.RepeatWrapping;
    table_material.map.wrapT = THREE.RepeatWrapping;
    table_material.map.repeat.set(1, 1);

    table_material.bumpMap = tableTex;
    table_material.bumpScale = 0.2;

    hammer_material = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ map: texture_loader.load( 'images/plywood.jpg' )}),
        .4, // medium friction
        .4 // medium restitution
    );
    hammer_material.map.wrapS = THREE.RepeatWrapping;
    hammer_material.map.wrapT = THREE.RepeatWrapping;
    hammer_material.map.repeat.set(1, 1);


    var melonTex = texture_loader.load("images/melon.jpg");
    melon_material = Physijs.createMaterial(
      new THREE.MeshLambertMaterial({ map: melonTex}),
      .4, // medium friction
      .4 // medium restitution
    );
    melon_material.map.wrapS = THREE.RepeatWrapping;
    melon_material.map.wrapT = THREE.RepeatWrapping;
    melon_material.map.repeat.set(.5, .5);

    melon_material.bumpMap = melonTex;
    melon_material.bumpScale = 0.2;

    bulb_material = Physijs.createMaterial(
      new THREE.MeshLambertMaterial({emissive: 0xFFFFFF}),
      .4, // medium friction
      .4 // medium restitution
    );
};

initScene = function() {
    model_loader = new THREE.JSONLoader();

    var room_piece = new THREE.BoxGeometry(200, 1, 200);

    floor = new Physijs.BoxMesh(
        room_piece,
        floor_material,
        0 // mass
    );
    floor.position.set(0,-25,50);
    floor.receiveShadow = true;
    scene.add(floor);

    ceiling = new Physijs.BoxMesh(
        room_piece,
        floor_material,
        0 // mass
    );
    ceiling.position.set(0,50,50);
    ceiling.receiveShadow = true;
    scene.add(ceiling);

    wall1 = new Physijs.BoxMesh(
        room_piece,
        wall_material,
        0 // mass
    );
    wall1.rotation.set((90*Math.PI/180),0,0);
    wall1.position.set(0,0,-25);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    scene.add(wall1);

    wall2 = new Physijs.BoxMesh(
        room_piece,
        wall_material,
        0 // mass
    );
    wall2.rotation.set((90*Math.PI/180),0,(90*Math.PI/180));
    wall2.position.set(50,0,50);
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    scene.add(wall2);

    wall3 = new Physijs.BoxMesh(
        room_piece,
        wall_material,
        0 // mass
    );
    wall3.rotation.set((90*Math.PI/180),0,(90*Math.PI/180));
    wall3.position.set(-50,0,50);
    wall3.castShadow = true;
    wall3.receiveShadow = true;
    scene.add(wall3);

    wall4 = new Physijs.BoxMesh(
        room_piece,
        wall_material,
        0 // mass
    );
    wall4.rotation.set((90*Math.PI/180),0,0);
    wall4.position.set(0,0,150);
    wall4.castShadow = true;
    wall4.receiveShadow = true;
    scene.add(wall4);

    model_loader.load("models/table.json",
    function(geometry, materials){
        table = new Physijs.ConvexMesh(
            geometry,
            table_material,
            0, //mass
            {retitution: 0.2, friction: 0.8}
        );
        table.name = "table";
        table.castShadow = true;
        table.receiveShadow = true;
        scene.add(table);
});

    spawnBulb();
    spawnHammer();
    spawnFruit();

    intersect_plane = new THREE.Mesh(
        new THREE.PlaneGeometry( 500, 500 ),
        new THREE.MeshBasicMaterial({opacity: 0, transparent: true})
    );
    intersect_plane.rotation.x = Math.PI / -2;
    scene.add(intersect_plane);
};


initGUI = function() {

    gui = new dat.GUI();
    var parameters =
    {
        Power: 50,
        spawn: function() {spawnFruit()},
        reset: function() {resetAll()},
    };
    var pow = gui.add(parameters, 'Power').min(1).max(100).step(1).listen();
    pow.onChange(function(value) {
        power = value;
    });

    gui.add(parameters, 'spawn').name("Spawn Fruit");
    gui.add(parameters, 'reset').name("Reset to Default Values");

    gui.open();

};

resetAll = function() {
    for (var i = 0; i < allFruits.length; i++) {
        scene.remove(allFruits[i]);
    }
    allFruits = [];
    fruitCounter = 0;

    for (var i = 0; i < fruit_pieces.length; i++) {
        scene.remove(fruit_pieces[i]);
    }
    fruit_pieces = [];

    scene.remove(hammer);
    scene.remove(bulb);
    pickable_objects = [];

    spawnHammer();
    spawnBulb();
    spawnFruit();
}

render = function() {
    if (lights.point_light && bulb) {
        lights.point_light.position.set(bulb.position.x, bulb.position.y+5, bulb.position.z);
    }
    for (var i = 0; i < gnats.length; i++){
      gnats[i].rotation.y += 0.1;
      gnats[i].rotation.x += 0.05;
    }
    requestAnimationFrame(render);
    renderer.render(scene, camera);
    render_stats.update();
};

spawnBulb = function() {
    model_loader.load("models/lightbulb.json",
    function(geometry, materials){
        bulb = new Physijs.ConvexMesh(
            geometry,
            bulb_material,
            2, //mass
            {retitution: 0.2, friction: 0.8}
        );
        bulb.position.set(lightX, lightY, lightZ);
        scene.add(bulb);
        pickable_objects.push(bulb);

        var constraint = new Physijs.ConeTwistConstraint(
            bulb, // First object to be constrained
            ceiling, // Second object to be constrained
            new THREE.Vector3( lightX, lightY+25, lightZ ) // point in the scene to apply the constraint
        );
        scene.addConstraint( constraint );
        constraint.setLimit( (30*Math.PI/180), (30*Math.PI/180), (30*Math.PI/180) ); // rotational limit, in radians, for each axis
    });
}

spawnHammer = function() {
    model_loader.load("models/hammer.json",
    function(geometry, materials){
        hammer = new Physijs.ConvexMesh(
            geometry,
            hammer_material,
            15, //mass
            {retitution: 0.2, friction: 0.8}
        );
        hammer.name = "hammer";
        hammer.position.set(-15,.1,10);
        hammer.rotation.set(0,(-90*Math.PI/180),0);
        hammer.castShadow = true;
        hammer.receiveShadow = true;

        hammer.addEventListener( 'collision', function( other_object, relative_velocity, relative_rotation, contact_normal ) {
            if (((other_object.name.substring(0, 5) == "fruit") && (power > 75)) && (((relative_velocity.y < -50) && (selected_obj != hammer)) || (hammer_hitting))){
                console.log("here");
                spawnPieces(other_object);
            }
            else if ( (other_object.name == "table") && (relative_velocity.y < -1) ){ //less than 0 when hammer is moving down
                //spawnDecal(hammer, "hammer");
                console.log("hammer missed and hit table");
                bulb.position.y = bulb.position.y + 1;
                bulb.__dirtyPosition = true;
            }
            hammer_hitting = false;
        });
        scene.add(hammer);
        pickable_objects.push(hammer);
});
}

spawnPieces = function(other_object) {
    scene.remove(other_object);
    for(var i = 0; i <= pickable_objects.length; i++){
        if(pickable_objects[i] == other_object) {
            pickable_objects.splice(i,1);
        }
    }
    var flx = other_object.position.x;
    var fly = other_object.position.y;
    var flz = other_object.position.z;
    var fruit_piece;
    var dir_root = "models/piece"
    for (var i = 1; i <= 6; i++){
        fruit_pieces[i].position.set(flx, fly, flz);
        scene.add(fruit_pieces[i]);
        pickable_objects.push(fruit_pieces[i]);
    };
}

/*
spawnDecal = function(object, type) { //object is the object that hit the other object, either the fruit piece or the hammer. type is "fruit" or "hammer"
    console.log("We have collision with object of type " + type + " at position " + String(object.position.x) + String(object.position.y) + String(object.position.z));

    decal_loader = new THREE.TextureLoader();
    var decalMaterial = new THREE.MeshLambertMaterial( {
        map: decal_loader.load('images/SplatterRound0057_S.jpg'),
        transparent: true,
        depthTest: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
    });

    meshToIntersect = new THREE.Mesh()

    position = (object.position);

    var decalGeometry = new THREE.DecalGeometry(
        meshToIntersect = new THREE.Mesh(),
        position, // THREE.Vector3 in world coordinates
        direction, // THREE.Vector3 specifying the orientation of the decal
        dimensions, // THREE.Vector3 specifying the size of the decal box
        check // THREE.Vector3 specifying what sides to clip (1-clip, 0-noclip)
    );

    var decal = new THREE.Mesh( decalGeometry, decalMaterial );

    decals.push(decal);
    scene.add(decal);

}
*/

spawnGnats = function(obj) {
    var particleCount = Math.random() * 5;
    var particles = new THREE.Geometry();
    var pMaterial = new THREE.PointsMaterial({
      color:0x302005,
      size:0.75
    });
    var pX, pY, pZ, particle;
    for (var p = 0; p < particleCount; p++) {
      pX = Math.random() * 2;
      pY = Math.random() * 2;
      pZ = Math.random() * 2;
      particle = new THREE.Vector3(pX, pY, pZ);
      particle.velocity = new THREE.Vector3(0, -Math.random(), 0);
      particles.vertices.push(particle);
    }
    var particleSystem = new THREE.Points(particles, pMaterial);
    particleSystem.sortParticles = true;
    obj.add(particleSystem);
    particleSystem.position.set(0, 12, 0);
    gnats.push(particleSystem);
}

spawnFruit = function() {
    model_loader.load("models/melon.json",
    function(geometry, materials){
        allFruits[fruitCounter] = new Physijs.ConvexMesh(
            geometry,
            melon_material,
            20 //mass
        );
        allFruits[fruitCounter].name = "fruit" + String(fruitCounter);
        allFruits[fruitCounter].position.set(2,0,0);
        allFruits[fruitCounter].castShadow = true;
        allFruits[fruitCounter].receiveShadow = true;
        scene.add(allFruits[fruitCounter]);
        pickable_objects.push(allFruits[fruitCounter]);
        spawnGnats(allFruits[fruitCounter]);
        fruitCounter += 1;

        var fruit_piece;
        var dir_root = "models/piece"
        for (var i = 1; i <= 7; i++){
            model_loader.load(dir_root + i + ".json",
            function(geometry, materials){
                fruit_pieces.unshift(new Physijs.ConvexMesh(geometry, melon_material, 3));

                fruit_pieces[0].addEventListener( 'collision', function( other_object, relative_velocity, relative_rotation, contact_normal ) {
                    //spawnDecal(fruit_pieces[0], "fruit");
                });
            });
        }
});
};

initEventHandling = function() {
    var _vector = new THREE.Vector3,
        handleMouseDown, handleMouseMove, handleMouseUp;

    handleMouseDown = function(evt) {
        var ray, intersection;
        _vector.set(
            (evt.clientX / window.innerWidth) * 2 - 1,
            -(evt.clientY / window.innerHeight) * 2 + 1,
            1
        );
        _vector.unproject(camera);
        ray = new THREE.Raycaster(camera.position, _vector.sub(camera.position).normalize());
        intersection = ray.intersectObjects(pickable_objects);
        if (intersection.length > 0) {
            selected_obj = intersection[0].object;

            if(selected_obj == hammer){
                hammer.rotation.set((-45*Math.PI/180),0,(-90*Math.PI/180));
                selected_obj.__dirtyRotation = true;
            }
            _vector.set(0, 0, 0);
            selected_obj.setAngularFactor(_vector);
            selected_obj.setAngularVelocity(_vector);
            selected_obj.setLinearFactor(_vector);
            selected_obj.setLinearVelocity(_vector);

            mouse_position.copy(intersection[0].point);

            intersect_plane.position.y = mouse_position.y;
  }
    }

    handleMouseMove = function(evt) {
        var ray, intersection,
            i, scalar;

        if (selected_obj !== null) {
            _vector.set(
                (evt.clientX / window.innerWidth) * 2 - 1,
                -(evt.clientY / window.innerHeight) * 2 + 1,
                1
            );
            _vector.unproject(camera);
            ray = new THREE.Raycaster(camera.position, _vector.sub(camera.position).normalize());

            intersection = ray.intersectObject(intersect_plane);
            mouse_position.copy(intersection[0].point);

            intersect_plane.position.y = mouse_position.y;
        }
    };

    handleMouseUp = function( evt ) {
        if (selected_obj !== null) {
            _vector.set(1, 1, 1);
            selected_obj.setAngularFactor( _vector );
            selected_obj.setLinearFactor( _vector );
            selected_obj.setAngularVelocity(_vector);
    selected_obj = null;
        }
    };

    return function() {
        renderer.domElement.addEventListener( 'mousedown', handleMouseDown );
        renderer.domElement.addEventListener( 'mousemove', handleMouseMove );
        renderer.domElement.addEventListener( 'mouseup', handleMouseUp );
    };
}();

function keydown(ev) {
    switch (ev.keyCode) {
        case 16: //shift
            if((selected_obj.position.y) >= 30){
                break;
            }
            if(selected_obj == hammer){
                hammer.rotation.set((-45*Math.PI/180),0,(-90*Math.PI/180));
                selected_obj.__dirtyRotation = true;
            }
            selected_obj.position.y = selected_obj.position.y + 5
            selected_obj.__dirtyPosition = true;
            break;

        case 32: //space
            hammer_hitting = true;
            hammer.rotation.set((90*Math.PI/180),(90*Math.PI/180),(0*Math.PI/180));
            selected_obj.__dirtyRotation = true;
            selected_obj.position.y = 2;
            selected_obj.__dirtyPosition = true;
            break;

        case 76: //'L'
            if (lighton){
                scene.remove(lights.point_light);
                lighton = false;
            }
            else{
                scene.add(lights.point_light);
                lighton = true;
            }

        default:
            return;
    }
};


init = function() {
    initEngine();
    initLights();
    initObjects();
    initScene();
    initGUI();
    initEventHandling();
    requestAnimationFrame(render);
    scene.simulate();

    document.onkeydown = function(ev){
        keydown(ev);
    };
};

window.onload = init;
