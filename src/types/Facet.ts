/**
 * Facettes calculées côté API sur la requête filtrée.
 * `count` = nombre de résultats si cette valeur était sélectionnée
 * (les autres filtres actifs étant conservés).
 */
export type Facet = {
	value: string;
	label: string;
	count: number;
};

export type FacetMap<K extends string = string> = Partial<Record<K, Facet[]>>;
