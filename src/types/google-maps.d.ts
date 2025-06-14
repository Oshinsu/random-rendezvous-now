
declare global {
  namespace google {
    namespace maps {
      class Map {
        constructor(mapDiv: HTMLElement, opts?: any);
        setOptions(options: any): void;
        getCenter(): any;
        getZoom(): number;
        setCenter(latlng: any): void;
        setZoom(zoom: number): void;
        panTo(latlng: any): void;
        fitBounds(bounds: any): void;
        addListener(eventName: string, handler: Function): any;
      }
      
      class Marker {
        constructor(opts?: any);
        setPosition(latlng: any): void;
        setMap(map: Map | null): void;
        getPosition(): any;
        setVisible(visible: boolean): void;
        addListener(eventName: string, handler: Function): any;
      }
      
      class InfoWindow {
        constructor(opts?: any);
        open(map?: Map, anchor?: Marker): void;
        close(): void;
        setContent(content: string): void;
        getContent(): string;
      }
      
      class Size {
        constructor(width: number, height: number);
      }
      
      class Point {
        constructor(x: number, y: number);
      }
      
      enum MapTypeId {
        ROADMAP = 'roadmap',
        SATELLITE = 'satellite',
        HYBRID = 'hybrid',
        TERRAIN = 'terrain'
      }
    }
  }
}

export {};
