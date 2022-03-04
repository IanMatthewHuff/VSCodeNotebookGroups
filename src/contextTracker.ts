// Context tracker exists to keep tabs on all cells that are part of each run group
// When files are opened we scan the metadata for them to see what cells are in which run
// groups. We also update this as cells are added and removed from the run groups
export class ContextTracker {
    private cellMapping: Map<string, string> = new Map<string, string>();

    // Just one instance of our Context Tracker we can use from anywhere
    private static instance: ContextTracker;
    private constructor() {}

    public static getContextTracker(): ContextTracker {
        if (!ContextTracker.instance) {
            ContextTracker.instance = new ContextTracker();
        }

        return ContextTracker.instance;
    }

    // For the given ID (cell + document) change the membership
    public updateCellMembership(cellId: string, membership: string) {
    }
}
