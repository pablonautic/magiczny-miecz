import * as THREE from "three";

export enum STATE {
    NONE = -1,
    ROTATE = 0,
    PAN = 2,
    TOUCH_ROTATE = 3,
    TOUCH_DOLLY_PAN = 4
}

export class ObjectMover {

    private mouseButtons = { LEFT: THREE.MOUSE.LEFT, MIDDLE: THREE.MOUSE.MIDDLE, RIGHT: THREE.MOUSE.RIGHT };

    private state = STATE.NONE;

    private rotateStart = new THREE.Vector2();
    private rotateEnd = new THREE.Vector2();
    private rotateDelta = new THREE.Vector2();

    private panStart = new THREE.Vector2();
    private panEnd = new THREE.Vector2();
    private panDelta = new THREE.Vector2();

    private rotateSpeed = 1.0;
    private panSpeed = 1.0;


    constructor(private container: HTMLElement) {

        container.addEventListener('mousedown', this.onMouseDown, false);
        //container.addEventListener('wheel', onMouseWheel, false);

        container.addEventListener('touchstart', this.onTouchStart, false);
        container.addEventListener('touchend', this.onTouchEnd, false);
        container.addEventListener('touchmove', this.onTouchMove, false);
    }



    private onMouseDown = (event: MouseEvent) => {
        event.preventDefault();

        var x = event.clientX;
        var y = event.clientY;

        switch (event.button) {
            case this.mouseButtons.LEFT:
                this.state = STATE.ROTATE;
                this.handleRotateStart(x, y);
                break;
            case this.mouseButtons.RIGHT:
                this.state = STATE.PAN;
                this.handlePanStart(x, y);
                break;
        }

        if (this.state !== STATE.NONE) {
            this.container.addEventListener('mousemove', this.onMouseMove, false);
            this.container.addEventListener('mouseup', this.onMouseUp, false);
        }

    }

    private onMouseMove = (event: MouseEvent) => {
        event.preventDefault();

        switch (this.state) {
            case STATE.ROTATE:
                this.handleRotateMove(event.clientX, event.clientY);
                break;
            case STATE.PAN:
                this.handlePanMove(event.clientX, event.clientY);
                break;
        }
    }

    private onMouseUp = (event: MouseEvent) => {

        this.state = STATE.NONE;

        this.container.removeEventListener('mousemove', this.onMouseMove, false);
        this.container.removeEventListener('mouseup', this.onMouseUp, false);

        this.handleEnd();
        //scope.dispatchEvent(endEvent);
    }

    private touchToState = (event: TouchEvent) => {
        switch (event.touches.length) {
            case 1:
                return STATE.TOUCH_DOLLY_PAN;
            case 2:
                return STATE.TOUCH_ROTATE;
            default:
                return STATE.NONE;
        }
    }

    private onTouchStart = (event: TouchEvent) => {
        event.preventDefault();

        this.state = this.touchToState(event);
        switch (this.state) {
            case STATE.TOUCH_ROTATE:
                var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
                var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
                this.handleRotateStart(x, y);
                break;
            case STATE.TOUCH_DOLLY_PAN:
                var x = event.touches[0].pageX;
                var y = event.touches[0].pageY;
                this.handlePanStart(x, y);
                break;
            default:
                break;
        }

        if (this.state !== STATE.NONE) {
            //scope.dispatchEvent(startEvent);
        }
    }

    private onTouchMove = (event: TouchEvent) => {
        event.preventDefault();
        event.stopPropagation();

        var localState = this.touchToState(event);

        switch (localState) {
            case STATE.TOUCH_ROTATE:
                var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
                var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
                this.handleRotateMove(x, y);
                break;
            case STATE.TOUCH_DOLLY_PAN:
                var x = event.touches[0].pageX;
                var y = event.touches[0].pageY;
                this.handlePanMove(x, y);
                break;
            default:
                this.state = STATE.NONE;
                break;
        }
    }

    private onTouchEnd = (event: TouchEvent) => {
        this.handleEnd();
        this.state = STATE.NONE;
    }

    handleEnd = () => {
    }

    handlePanStart(x: number, y: number) {
        this.panStart.set(x, y);
    }

    handleRotateStart(x: number, y: number) {
        this.rotateStart.set(x, y);
    }

    handleRotateMove = (x: number, y: number) => {
        this.rotateEnd.set(x, y);
        this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);
        var element = this.container; // scope.domElement === document ? scope.domElement.body : scope.domElement;
        this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientHeight); // yes, height
        this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight);
        this.rotateStart.copy(this.rotateEnd);
        //scope.update();
    }

    handlePanMove = (x: number, y: number) => {
        this.panEnd.set(x, y);
        this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);
        this.pan(this.panDelta.x, this.panDelta.y);
        this.panStart.copy(this.panEnd);
        //scope.update();
    }

    pan = (x, y) => {
        console.log("pan " + x + " " + y);
    }

    rotateLeft = (a) => {
        console.log("rotateLeft " + a);
    }

    rotateUp = (a) => {
        console.log("rotateUp " + a);
    }
}
