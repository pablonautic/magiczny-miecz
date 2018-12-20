import { fromEvent } from "rxjs";
import { debounceTime } from "rxjs/operators";

import * as THREE from "three";
import * as CANNON from "cannon";

import "app/../assets/js/EnableThreeExamples";
import "three/examples/js/controls/OrbitControls";
import "three/examples/js/loaders/GLTFLoader";

import { DiceManager, DiceD6 } from "@App/modules/threejs-dice";

import { Skybox } from "@App/game/Skybox";
import { ObjectMover } from "@App/game/ObjectMover";
import { World } from "@App/game/logic/World";
import { IActor } from "@App/game/logic/IActor";
import { Collections } from "@Common/utils/Collections";
import { Services } from "@Common/infrastructure/Services";
import { Event } from "@Common/events/Event";
import { Player } from "@Common/mechanics/Player";
import { ClientEventDispatcher } from "@App/game/events/ClientEventDispatcher";
import { Card } from "@App/game/logic/Card";

export class Game {

    container: HTMLElement;

    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: THREE.OrbitControls;
    clock: THREE.Clock;
    plane: THREE.Mesh;
    offset: THREE.Vector3;
    raycaster: THREE.Raycaster;
    //stats: any;

    interectionObjects: THREE.Object3D[] = [];
    draggedObject: THREE.Object3D;

    dragInitialPosition = new THREE.Vector3();
    dragInitialRotation = new THREE.Euler();

    id: string;

    currentPlayerId: string;

    world: World;

    actors: IActor[] = [];

    physicsScene: CANNON.World;

    dice: DiceD6;

    events: Event[] = [];

    players: Player[] = [];

    eventDispatcher: ClientEventDispatcher;

    objectMover: ObjectMover;

    constructor(vieport: any, public services: Services) {

        this.container = vieport;

        if (!this.container) {
            throw new Error("cannot find viewport");
        }

        this.offset = new THREE.Vector3();
        this.raycaster = new THREE.Raycaster();

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0xcce0ff, 0.0003);


        var viewAngle = 45, aspect = this.width / this.height, near = 1, far = 1000;
        this.camera = new THREE.PerspectiveCamera(viewAngle, aspect, near, far);
        this.resetCamera();

        this.scene.add(this.camera);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setClearColor(this.scene.fog.color);

        this.container.appendChild(this.renderer.domElement);

        this.container.addEventListener("mousedown", this.onDocumentMouseDown, false);
        this.container.addEventListener("mousemove", this.onDocumentMouseMove, false);
        this.container.addEventListener("mouseup", this.onDocumentMouseUp, false);

        //this.objectMover = new ObjectMover(this.container);

        this.threeXWindowResize(this.renderer, this.camera);


        this.controls = new THREE.OrbitControls(this.camera, this.container);
        this.controls.target = new THREE.Vector3(0, 0, 0);
        this.controls.maxDistance = 300;

        const source = fromEvent(this.controls, "change");
        const result = source.pipe(debounceTime(1000));
        result.subscribe(_ => {
            console.log(this.eventDispatcher.cameraChangeEventHandler);
            this.eventDispatcher.cameraChangeEventHandler.cameraChanged(this.camera);
        });

        // Prepare clock
        this.clock = new THREE.Clock();

        // Prepare stats
        //this.stats = new Stats();
        //this.stats.domElement.style.position = 'absolute';
        //this.stats.domElement.style.left = '50px';
        //this.stats.domElement.style.bottom = '50px';
        //this.stats.domElement.style.zIndex = 1;
        //this.container.appendChild(this.stats.domElement);

        // Add lights
        this.scene.add(new THREE.AmbientLight(0x444444));

        var dirLight = new THREE.DirectionalLight(0xffffff);
        dirLight.position.set(200, 200, 1000).normalize();
        this.camera.add(dirLight);
        this.camera.add(dirLight.target);

        this.scene.add(new Skybox().mesh);

        // Plane, that helps to determinate an intersection position
        this.plane = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(500, 500, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0x00ffff, visible: false, side: THREE.DoubleSide }));
        this.plane.lookAt(new THREE.Vector3(0, 1, 0));

        this.scene.add(this.plane);

        this.physicsScene = new CANNON.World();
        this.physicsScene.gravity.set(0, -9.8 * 20, 0); // m/s²

        var groundShape = new CANNON.Plane();
        var groundBody = new CANNON.Body({
            mass: 0 // mass == 0 makes the body static
        });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.physicsScene.addBody(groundBody);

        this.world = new World(this);

        //var composer = new THREE.EffectComposer(this.renderer);

        //var renderPass = new THREE.RenderPass(this.scene, this.camera);
        //composer.addPass(renderPass);

        //var outlinePass = new THREE.OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.scene, this.camera);
        //composer.addPass(outlinePass);

        DiceManager.setWorld(this.physicsScene);

        this.dice = new DiceD6({ backColor: "#1A6481", fontColor: "#FFFFFF", size: 5 });
        this.scene.add(this.dice.getObject());
        this.throwDice(5);
    }

    public init() {

        this.renderer.setSize(this.width, this.height);

        var dt = 1 / 60;

        var animate = () => {

            this.physicsScene.step(dt);

            this.dice.updateMeshFromBody();

            this.renderer.render(this.scene, this.camera);
            this.controls.update();

            requestAnimationFrame(animate);
        };

        animate();
    }

    public throwDice(value: number) {

        this.dice.getObject().position.x = Math.random() * 45;
        this.dice.getObject().position.y = 10;
        this.dice.getObject().position.z = 10;
        this.dice.getObject().rotation.x = 20 * Math.PI / 180;
        this.dice.getObject().body.velocity.set(Math.random() * 20, 0, 0);
        this.dice.getObject().body.angularVelocity.set(Math.random() * 20, 4, 3);

        this.dice.updateBodyFromMesh();

        DiceManager.prepareValues([{ dice: this.dice, value: value }]);
    }

    private resetCamera = () => {
        this.camera.position.set(0, 75, 75);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    }


    public findPlayer(playerId: string): Player {
        return this.players.find(p => p.id === playerId);
    }

    public getCurrentPlayer(): Player {
        return this.findPlayer(this.currentPlayerId);
    }

    findActor(id: string): IActor {
        var actor = this.actors.find(a => a.id === id);
        return actor ? actor : this.findActorDeep(id);
    }

    private findActorDeep(id: string): IActor {
        for (var stack of this.world.cardStacks) {
            if (stack.id === id) {
                return stack;
            }
            var card = stack.findDisposedCard(id);
            if (card) {
                return card;
            }
            card = stack.findCard(id);
            if (card) {
                return card;
            }
            card = stack.findDrawnCard(id);
            if (card) {
                return card;
            }
        }
        return undefined;
    }

    addActor(actor: IActor) {
        this.actors.push(actor);
        this.scene.add(actor.object3D);
        this.interectionObjects.push(actor.object3D);
    }

    removeActor(actor: IActor) {

        var object3D = actor.object3D;
        this.interectionObjects = Collections.remove(this.interectionObjects, object3D);
        //just in case
        if (this.draggedObject === actor.object3D) {
            this.draggedObject = null;
        }

        this.scene.remove(object3D);

        this.actors = Collections.remove(this.actors, object3D);
    }

    //BEWARE: the functions below cannot be converted to member functions, since the "this" context is different when using "old-style" binding !

    private updateRaycaster = (event: MouseEvent) => {

        var mouseX = (event.offsetX / this.width) * 2 - 1;
        var mouseY = -(event.offsetY / this.height) * 2 + 1;

        var vector = new THREE.Vector3(mouseX, mouseY, 1);
        vector.unproject(this.camera);

        this.raycaster.set(this.camera.position, vector.sub(this.camera.position).normalize());

        //this.raycaster.setFromCamera({ x: event.clientX,  y: event.clientY }, this.camera);
    }

    private onDocumentMouseDown = (event: MouseEvent) => {

        this.updateRaycaster(event);

        var intersects = this.raycaster.intersectObjects(this.interectionObjects, true);

        if (intersects.length > 0) {

            var hitMesh = intersects[0].object;
            var hitActor = <IActor>hitMesh.userData["parent"];

            var attr = hitMesh.userData[Card.attributeData];
            if (attr) {
                var card = hitActor as Card;
                this.eventDispatcher.cardSetAttributeClientEventHandler.increment(card, attr, event.buttons === 2 ? -1 : 1);
            }

            if (hitActor.selectable) {
                this.world.selectActor(hitActor);
            } else {
                this.world.clearSelectedActor();
            }

            if (hitActor.draggable) {
                this.draggedObject = hitActor.object3D;
                this.dragInitialPosition.copy(this.draggedObject.position);
                this.dragInitialRotation.copy(this.draggedObject.rotation);
                this.controls.enabled = false;
            }
        } else {
            this.world.clearSelectedActor();
        }

    }

    private onDocumentMouseMove = (event: MouseEvent) => {
        event.preventDefault();

        this.updateRaycaster(event);

        if (this.draggedObject) {

            if (event.buttons === 2) {
                this.draggedObject.rotateY((event.movementX) / 300);

            } else {
                var intersects = this.raycaster.intersectObject(this.plane);
                var intersect = intersects[0].point;
                this.draggedObject.position.x = intersect.x;
                this.draggedObject.position.z = intersect.z;

            }
        }
    }

    // ReSharper disable once UnusedParameter
    private onDocumentMouseUp = (event: MouseEvent) => {

        if (!this.draggedObject) {
            return;
        }

        var finalPosition = this.draggedObject.position;

        if (finalPosition.distanceTo(this.dragInitialPosition) > 0.001) {
            var actor = this.draggedObject.userData["parent"];
            this.eventDispatcher.actorMoveHandler.moveActor(actor);
        }

        var finalRotation = this.draggedObject.rotation;
        if (finalRotation.toVector3().distanceTo(this.dragInitialRotation.toVector3()) > 0.001) {
            var actor2 = this.draggedObject.userData["parent"];
            this.eventDispatcher.actorRotateHandler.moveActor(actor2);
        }

        this.draggedObject = null;
        this.controls.enabled = true;
    }

    // end of BEWARE

    new() {
        this.resetCamera();
        this.world.newGame();
    }

    private threeXWindowResize(renderer, camera) {

        var callback = () => {
            renderer.setSize(this.width, this.height);
            camera.aspect = this.width / this.height;
            camera.updateProjectionMatrix();
        }

        window.addEventListener("resize", callback, false);

        return {
            stop: () => {
                window.removeEventListener("resize", callback);
            }
        };
    }

    get width(): number { return this.container.clientWidth; }
    get height(): number { return this.container.clientHeight; }

}
