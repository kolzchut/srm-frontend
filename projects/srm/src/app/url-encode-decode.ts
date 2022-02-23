import { GeoType, State } from "./state.service";

interface StateFieldEncoderDecoder<T> {
  encode(part: T | null): string[];
  decode(part: string[]): T | null;
}

class StringEncoderDecoder implements StateFieldEncoderDecoder<string> {
  encode(part: string | null): string[] {
    return part ? [part] : [];
  }
  decode(part: string[]): string | null {
    return part ? part[0] : null;
  }
}

class SituationsEncoderDecoder implements StateFieldEncoderDecoder<string[][]> {
  encode(part: string[][] | null): string[] {
    const situations = part || [];
    return situations.map((g) => g.join(','));
  }
  decode(part: string[]): string[][] | null {
    return part.map((g) => g.split(',')) || null;
  }
}

class GeoEncoderDecoder implements StateFieldEncoderDecoder<GeoType> {
  encode(part: GeoType | null): string[] {
    const ret: number[] = [];
    if (part) {
      if (part.length === 2) {
        ret.push(part[0][0], part[0][1], part[1][0], part[1][1]);
      } else {
        ret.push(...part);
      }
    } else {
      return [];
    }
    return ret.map((x) => x.toString());
  }
  decode(part: string[]): GeoType | null {
    if (part.length === 3) {
      return part.map((x) => parseFloat(x)) as GeoType;
    } else if (part.length === 4) {
      return [[parseFloat(part[0]), parseFloat(part[1])], 
      [parseFloat(part[2]), parseFloat(part[3])]] as GeoType;
    }
    return null;
  }
}

export class StateEncoderDecoder {
  
  stringEncoder = new StringEncoderDecoder();
  situationsEncoder = new SituationsEncoderDecoder();
  geoEncoder = new GeoEncoderDecoder();

  MAPPER: [string, StateFieldEncoderDecoder<any>][] = [
    ['geo',this.geoEncoder],
    ['searchBoxTitle', this.stringEncoder],
    ['cardId', this.stringEncoder],
    ['pointId', this.stringEncoder],
    ['placeId', this.stringEncoder],
    ['responseId', this.stringEncoder],
    ['situations', this.situationsEncoder],
  ];

  encode(state: State): string {
    let encoded = this.MAPPER
      .map(([key, encoder]) => encoder.encode((state as any)[key] || null))
      .map((x) => x.join('@'));
    while (encoded.length && encoded[encoded.length - 1] === '') {
      encoded.pop();
    }
    return encoded.join('!');
  }

  decode(encoded: string): State {
    const decoded: string[][] = encoded.split('!').map((str) => str.split('@'));
    const state: State = {};
    for (const i in this.MAPPER) {
      const [key, decoder] = this.MAPPER[i];
      const value = decoded[i] || [];
      (state as any)[key] = decoder.decode(value);
    }
    return state;
  }
}
