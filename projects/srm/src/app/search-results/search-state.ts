import { computed, signal } from "@angular/core";

export class SearchState {

    // Search counts
    mapCount = signal<number>(0);
    nationalCount = signal<number>(0);
    nationWideCount = signal<number>(0);
    onlyNational = computed(() => this.nationalCount() === this.nationWideCount() && this.nationalCount() > 0);

    // Loading
    mapLoading = signal<boolean>(false);
    nationalLoading = signal<boolean>(false);

    setLoading(full: boolean) {
        this.mapLoading.set(true);
        if (full) {
            this.nationalLoading.set(true);
        }
    }

    disableLoading() {
        this.mapLoading.set(false);
        this.nationalLoading.set(false);
    }

    setMapCount(count: number) {
        this.mapCount.set(count);
        this.mapLoading.set(false);
    }
    
    setNationalCounts(nationWideCount: number, nationalCount: number) {
        this.nationalCount.set(nationalCount);
        this.nationWideCount.set(nationWideCount);
        this.nationalLoading.set(false);
    }

    anyLoading() {
        return this.mapLoading() || this.nationalLoading();
    }
}
