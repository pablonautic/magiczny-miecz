import * as THREE from "three";

export enum STATE {
    NONE = -1,
    ROTATE = 0,
    DOLLY = 1,
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

                if (event.ctrlKey || event.metaKey || event.shiftKey) {

                    //if (scope.enablePan === false) return;

                    this.handleMouseDownPan(event);

                    this.state = STATE.PAN;

                } else {

                    //if (scope.enableRotate === false) return;

                    this.handleMouseDownRotate(event);

                    this.state = STATE.ROTATE;

                }

                break;

            case this.mouseButtons.MIDDLE:

                //if (scope.enableZoom === false) return;

                this.handleMouseDownDolly(event);

                this.state = STATE.DOLLY;

                break;

            case this.mouseButtons.RIGHT:

                //if (scope.enablePan === false) return;

                this.handleMouseDownPan(event);

                this.state = STATE.PAN;

                break;

        }

        if (this.state !== STATE.NONE) {

            this.container.addEventListener('mousemove', this.onMouseMove, false);
            this.container.addEventListener('mouseup', this.onMouseUp, false);

            //scope.dispatchEvent(startEvent);

        }

    }

    private onMouseMove = (event: MouseEvent) => {
        event.preventDefault();

        switch (this.state) {

            case STATE.ROTATE:

                //if (scope.enableRotate === false) return;

                this.handleMouseMoveRotate(event);

                break;

            case STATE.DOLLY:

                //if (scope.enableZoom === false) return;

                this.handleMouseMoveDolly(event);

                break;

            case STATE.PAN:

                //if (scope.enablePan === false) return;

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

    private onTouchStart = (event: TouchEvent) => {

        event.preventDefault();

        switch (event.touches.length) {

            case 1:	// one-fingered touch: rotate

                //if (scope.enableRotate === false) return;

                this.handleTouchStartRotate(event);

                this.state = STATE.TOUCH_ROTATE;

                break;

            case 2:	// two-fingered touch: dolly-pan

                //if (scope.enableZoom === false && scope.enablePan === false) return;

                this.handleTouchStartDollyPan(event);

                this.state = STATE.TOUCH_DOLLY_PAN;

                break;

            default:

                this.state = STATE.NONE;

        }

        if (this.state !== STATE.NONE) {

            //scope.dispatchEvent(startEvent);

        }
    }


    private onTouchMove = (event: TouchEvent) => {


        event.preventDefault();
        event.stopPropagation();

        switch (event.touches.length) {

            case 1: // one-fingered touch: rotate

                //if (scope.enableRotate === false) return;

                if (this.state !== STATE.TOUCH_ROTATE) return; // is this needed?

                this.handleTouchMoveRotate(event);

                break;

            case 2: // two-fingered touch: dolly-pan

                //if (scope.enableZoom === false && scope.enablePan === false) return;

                if (this.state !== STATE.TOUCH_DOLLY_PAN) return; // is this needed?

                this.handleTouchMoveDollyPan(event);

                break;

            default:

                this.state = STATE.NONE;

        }

    }

    private onTouchEnd = (event: TouchEvent) => {

        this.handleTouchEnd(event);

        //scope.dispatchEvent(endEvent);

        this.state = STATE.NONE;
    }

    //mouse event handlers

    handleMouseDownRotate = (event: MouseEvent) => {

        //console.log( 'handleMouseDownRotate' );

        this.rotateStart.set(event.clientX, event.clientY);

    }

    handleMouseDownDolly = (event: MouseEvent) => {

        //console.log( 'handleMouseDownDolly' );

        this.dollyStart.set(event.clientX, event.clientY);

    }

    handleMouseDownPan = (event: MouseEvent) => {

        //console.log( 'handleMouseDownPan' );

        this.panStart.set(event.clientX, event.clientY);

    }

    handleMouseMoveRotate = (event: MouseEvent) => {

        //console.log( 'handleMouseMoveRotate' );

        this.rotateEnd.set(event.clientX, event.clientY);

        this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);

        var element = this.container; // scope.domElement === document ? scope.domElement.body : scope.domElement;

        this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientHeight); // yes, height

        this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight);

        this.rotateStart.copy(this.rotateEnd);

        //scope.update();

    }

    handleMouseMoveDolly = (event: MouseEvent) => {

        //console.log( 'handleMouseMoveDolly' );

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

        //console.log( 'handleMouseMovePan' );

        this.panEnd.set(event.clientX, event.clientY);

        this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);

        this.pan(this.panDelta.x, this.panDelta.y);

        this.panStart.copy(this.panEnd);

        //scope.update();

    }

    handleMouseUp = (event: MouseEvent) => {

        // console.log( 'handleMouseUp' );

    }

    //touch event handlers

    handleTouchStartRotate = (event) => {

        //console.log( 'handleTouchStartRotate' );

        this.rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);

    }

    handleTouchStartDollyPan = (event)=> {

        //console.log( 'handleTouchStartDollyPan' );

        //if (scope.enableZoom) {

        //    var dx = event.touches[0].pageX - event.touches[1].pageX;
        //    var dy = event.touches[0].pageY - event.touches[1].pageY;

        //    var distance = Math.sqrt(dx * dx + dy * dy);

        //    this.dollyStart.set(0, distance);

        //}

        //if (scope.enablePan) {

        var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
        var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);

        this.panStart.set(x, y);

        //}

    }

    handleTouchMoveRotate = (event) => {

        //console.log( 'handleTouchMoveRotate' );

        this.rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);

        this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);

        var element = this.container; // scope.domElement === document ? scope.domElement.body : scope.domElement;

        this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientHeight); // yes, height

        this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight);

        this.rotateStart.copy(this.rotateEnd);

        //scope.update();

    }

    handleTouchMoveDollyPan = (event) => {

        //console.log( 'handleTouchMoveDollyPan' );

        //if (scope.enableZoom) {

        //    var dx = event.touches[0].pageX - event.touches[1].pageX;
        //    var dy = event.touches[0].pageY - event.touches[1].pageY;

        //    var distance = Math.sqrt(dx * dx + dy * dy);

        //    this.dollyEnd.set(0, distance);

        //    this.dollyDelta.set(0, Math.pow(this.dollyEnd.y / this.dollyStart.y, this.zoomSpeed));

        //    dollyIn(this.dollyDelta.y);

        //    dollyStart.copy(this.dollyEnd);

        //}

        //if (scope.enablePan) {

        var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
        var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);

        this.panEnd.set(x, y);

        this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);

        this.pan(this.panDelta.x, this.panDelta.y);

        this.panStart.copy(this.panEnd);

        //}

        //scope.update();

    }

    handleTouchEnd = (event) => {

        //console.log( 'handleTouchEnd' );

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
