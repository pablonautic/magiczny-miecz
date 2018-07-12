import * as THREE from 'three';

export class BoxObject {

  private _mesh: THREE.Mesh;
  private _box: THREE.BoxHelper;
  private _group: THREE.Group;

  public loaded = false;
  private _selected = false;

  get isSelected(): boolean {
     return this._selected;
  }
  set isSelected(value: boolean) {
    this._selected = value;
    this._box.visible = value;
  }

  constructor(public topTexture: string, public width: number, public aspect: number, public height: number, delay = false) {
    if (!delay) {
      this.init();
    }
  }

  init = () => {

    var geometry = new THREE.BoxGeometry(this.width, this.height, this.width / this.aspect);

    var mat = new THREE.MeshPhongMaterial({
      color: 0x7c858e,
    });

    var tex = new THREE.TextureLoader().load(this.topTexture); //async
    tex.minFilter = THREE.LinearFilter;

    var face = new THREE.MeshLambertMaterial({
      map: tex,
    });

    var materials = [
      mat,
      mat,
      face,
      mat,
      mat,
      mat
    ];

    this._mesh = new THREE.Mesh(geometry, materials);

    this._box = new THREE.BoxHelper(this._mesh, new THREE.Color(0x933ec4));
    this._box.visible = false;

    this._group = new THREE.Group();
    this._group.add(this._mesh);
    this._group.add(this._box);

    this._mesh.userData["parent"] = this._box.userData["parent"] = this._group.userData["parent"] = this;

    this.loaded = true;
  }

  get object3D(): THREE.Object3D { return this._group; }

  get mesh(): THREE.Mesh { return this._mesh; }

  get faceUrl(): string { return this.topTexture; }

}
