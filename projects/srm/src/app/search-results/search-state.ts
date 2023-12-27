import { computed, signal } from "@angular/core";

export class SearchState {

    LOADING = -1;

    // Search counts
    mapCount = signal<number>(0);
    nationalCount = signal<number>(0);
    nationWideCount = signal<number>(0);
    onlyNational = computed(() => this.nationalCount() === this.nationWideCount() && this.nationalCount() > 0);

    setLoading(full: boolean) {
        this.mapCount.set(this.LOADING);
        if (full) {
            this.nationalCount.set(this.LOADING);
            this.nationWideCount.set(this.LOADING);
        }
    }

    setMapCount(count: number) {
        this.mapCount.set(count);
    }
    
    setNationalCounts(nationWideCount: number, nationalCount: number) {
        this.nationalCount.set(nationalCount);
        this.nationWideCount.set(nationWideCount);
    }

    mapLoading() {
        return this.mapCount() === this.LOADING;
    }

    nationalLoading() {
        return this.nationalCount() === this.LOADING || this.nationWideCount() === this.LOADING;
    }

    anyLoading() {
        return this.mapLoading() || this.nationalLoading();
    }
}
