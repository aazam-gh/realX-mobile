declare module 'supercluster' {
  type BBox = [number, number, number, number];
  type Point = {
    type: 'Point';
    coordinates: [number, number];
  };
  type Feature<G, P = Record<string, unknown>> = {
    type: 'Feature';
    geometry: G;
    properties: P;
  };

  export interface Options<P = any, C = any> {
    minZoom?: number;
    maxZoom?: number;
    minPoints?: number;
    radius?: number;
    extent?: number;
    nodeSize?: number;
    log?: boolean;
    generateId?: boolean;
    map?: (props: P) => C;
    reduce?: (accumulated: C, props: C) => void;
  }

  export interface ClusterProperties {
    cluster: true;
    cluster_id: number;
    point_count: number;
    point_count_abbreviated: string | number;
  }

  export type PointFeature<P = any> = Feature<Point, P>;
  export type ClusterFeature<C = any> = Feature<Point, ClusterProperties & C>;

  export default class Supercluster<P = any, C = any> {
    constructor(options?: Options<P, C>);
    load(points: PointFeature<P>[]): Supercluster<P, C>;
    getClusters(bbox: BBox, zoom: number): (PointFeature<P> | ClusterFeature<C>)[];
    getTile(zoom: number, x: number, y: number): any;
    getChildren(clusterId: number): (PointFeature<P> | ClusterFeature<C>)[];
    getLeaves(clusterId: number, limit?: number, offset?: number): PointFeature<P>[];
    getClusterExpansionZoom(clusterId: number): number;
  }
}
