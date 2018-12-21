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

    private dollyStart = new THREE.Vector2();
    private dollyEnd = new THREE.Vector2();
    private dollyDelta = new THREE.Vector2();

    private zoomSpeed = 1.0;
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

        switch (event.button) {
            case this.mouseButtons.LEFT:
                this.handleMouseDownRotate(event);
                this.state = STATE.ROTATE;
                break;
            case this.mouseButtons.RIGHT:
                this.handleMouseDownPan(event);
                this.state = STATE.PAN;
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
                this.handleMouseMoveRotate(event);
                break;
            case STATE.PAN:
                this.handleMouseMovePan(event);
                break;
        }
    }

    private onMouseUp = (event: MouseEvent) => {
        this.handleMouseUp(event);

        this.container.removeEventListener('mousemove', this.onMouseMove, false);
        this.container.removeEventListener('mouseup', this.onMouseUp, false);
        //scope.dispatchEvent(endEvent);
        this.state = STATE.NONE;
    }

    private touchToState = (event: TouchEvent) => {
        switch (event.touches.length) {
            case 1:
                return STATE.TOUCH_DOLLY_PAN;
            case 2:
                this.handleTouchStartDollyPan(event);
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
                this.handleTouchStartRotate(event);
                break;
            case STATE.TOUCH_DOLLY_PAN:
                this.handleTouchStartDollyPan(event);
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
                this.handleTouchMoveRotate(event);
                break;
            case STATE.TOUCH_DOLLY_PAN:
                this.handleTouchMoveDollyPan(event);
                break;
            default:
                this.state = STATE.NONE;
                break;
        }
    }

    private onTouchEnd = (event: TouchEvent) => {
        this.handleTouchEnd(event);
        this.state = STATE.NONE;
    }

    //mouse event handlers

    handleMouseDownRotate = (event: MouseEvent) => {
        this.rotateStart.set(event.clientX, event.clientY);
    }

    handleMouseDownDolly = (event: MouseEvent) => {
        this.dollyStart.set(event.clientX, event.clientY);
    }

    handleMouseDownPan = (event: MouseEvent) => {
        this.panStart.set(event.clientX, event.clientY);
    }

    handleMouseMoveRotate = (event: MouseEvent) => {
        this.handleRotateCommon(event.clientX, event.clientY);
    }

    handleMouseMoveDolly = (event: MouseEvent) => {
        this.dollyEnd.set(event.clientX, event.clientY);
        this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);
        if (this.dollyDelta.y > 0) {
            //dollyIn(getZoomScale());
        } else if (this.dollyDelta.y < 0) {
            //dollyOut(getZoomScale());
        }
        this.dollyStart.copy(this.dollyEnd);
        //scope.update();
    }

    handleMouseMovePan = (event: MouseEvent) => {
        this.handlePanCommon(event.clientX, event.clientY);
    }

    handleMouseUp = (event: MouseEvent) => {
    }

    //touch event handlers

    handleTouchStartRotate = (event: TouchEvent) => {
        this.rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
    }

    handleTouchStartDollyPan = (event: TouchEvent) => {
        var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
        var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
        this.panStart.set(x, y);
    }

    handleTouchMoveRotate = (event: TouchEvent) => {
        this.handleRotateCommon(event.touches[0].pageX, event.touches[0].pageY);
    }

    handleTouchMoveDollyPan = (event: TouchEvent) => {
        var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
        var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);
        this.handlePanCommon(x, y);
    }

    handleRotateCommon = (x: number, y: number) => {
        this.rotateEnd.set(x, y);
        this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);
        var element = this.container; // scope.domElement === document ? scope.domElement.body : scope.domElement;
        this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientHeight); // yes, height
        this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight);
        this.rotateStart.copy(this.rotateEnd);
        //scope.update();
    }

    handlePanCommon = (x: number, y: number) => {
        this.panEnd.set(x, y);
        this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);
        this.pan(this.panDelta.x, this.panDelta.y);
        this.panStart.copy(this.panEnd);
        //scope.update();
    }

    handleTouchEnd = (event: TouchEvent) => {
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
