export interface IAbility {
    // Try to use the ability (e.g. initiated by player)
    // Return whether ability was successfully executed
    use(): boolean;
}
