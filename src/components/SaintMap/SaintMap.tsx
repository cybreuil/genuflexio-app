import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapGL, { Marker, NavigationControl, Popup } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";

import { setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

import "maplibre-gl/dist/maplibre-gl.css";

import type { Place } from "../../types/Place";
import "./SaintMap.css";

setWorkerUrl(workerUrl);

const ROLE_LABELS: Record<string, string> = {
	birth: "Naissance",
	death: "Mort",
	activity: "Activité",
	burial: "Sépulture",
};

/* Palette du site : sauge, sépia rouge, or, encre */
const ROLE_COLORS: Record<string, string> = {
	birth: "#4f6b52",
	death: "#a4423c",
	activity: "#b8923f",
	burial: "#5a5047",
};
const FALLBACK_COLOR = "#8b7f73";

const ROLE_ORDER = ["birth", "activity", "death", "burial"];

const DEFAULT_CENTER = { longitude: 10, latitude: 48 };

type SaintMapProps = {
	places: Place[];
};

type PlaceGroup = {
	key: string;
	latitude: number;
	longitude: number;
	places: Place[];
};

function roleColor(role: string) {
	return ROLE_COLORS[role] ?? FALLBACK_COLOR;
}

function roleLabel(role: string) {
	return ROLE_LABELS[role] ?? role;
}

function getGroupKey(place: Place): string {
	// Arrondi pour que deux lieux "identiques" à un epsilon près soient regroupés.
	return `${place.latitude.toFixed(5)},${place.longitude.toFixed(5)}`;
}

/** Disque divisé en secteurs égaux, un par rôle. Un seul rôle = disque plein. */
function markerBackground(places: Place[]): string {
	if (places.length === 1) return roleColor(places[0].role);
	const step = 360 / places.length;
	const stops = places.map((p, i) => {
		const c = roleColor(p.role);
		return `${c} ${i * step}deg ${(i + 1) * step}deg`;
	});
	return `conic-gradient(from -90deg, ${stops.join(", ")})`;
}

export function SaintMap({ places }: SaintMapProps) {
	const mapRef = useRef<MapRef>(null);

	const [hoveredKey, setHoveredKey] = useState<string | null>(null);
	const [pinnedKey, setPinnedKey] = useState<string | null>(null);

	const validPlaces = useMemo(
		() =>
			places.filter(
				(p) =>
					Number.isFinite(p.latitude) && Number.isFinite(p.longitude),
			),
		[places],
	);

	const groupedPlaces = useMemo<PlaceGroup[]>(() => {
		const groups = new Map<string, PlaceGroup>();

		for (const place of validPlaces) {
			const key = getGroupKey(place);
			const group = groups.get(key) ?? {
				key,
				latitude: place.latitude,
				longitude: place.longitude,
				places: [],
			};
			group.places.push(place);
			groups.set(key, group);
		}

		// Rôles dans un ordre stable (naissance → activité → mort → sépulture)
		for (const group of groups.values()) {
			group.places.sort(
				(a, b) =>
					ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role),
			);
		}

		return Array.from(groups.values());
	}, [validPlaces]);

	// Le popup suit le survol, sauf si un marker est épinglé (clic).
	const activeKey = pinnedKey ?? hoveredKey;
	const activeGroup = groupedPlaces.find((g) => g.key === activeKey) ?? null;

	const togglePin = useCallback((key: string) => {
		setPinnedKey((current) => (current === key ? null : key));
	}, []);

	useEffect(() => {
		setPinnedKey(null);
		setHoveredKey(null);
	}, [validPlaces]);

	useEffect(() => {
		if (!mapRef.current || validPlaces.length === 0) return;

		if (validPlaces.length === 1) {
			mapRef.current.flyTo({
				center: [validPlaces[0].longitude, validPlaces[0].latitude],
				zoom: 7,
				duration: 900,
			});
			return;
		}

		const lngs = validPlaces.map((p) => p.longitude);
		const lats = validPlaces.map((p) => p.latitude);

		mapRef.current.fitBounds(
			[
				[Math.min(...lngs), Math.min(...lats)],
				[Math.max(...lngs), Math.max(...lats)],
			],
			{ padding: 70, maxZoom: 8, duration: 900 },
		);
	}, [validPlaces]);

	if (validPlaces.length === 0) {
		return (
			<div className="saint-map saint-map--empty">
				<span>Aucune localisation disponible.</span>
			</div>
		);
	}

	// Légende : uniquement les rôles présents sur la carte
	const legendRoles = ROLE_ORDER.filter((role) =>
		validPlaces.some((p) => p.role === role),
	);

	return (
		<div className="saint-map">
			<MapGL
				ref={mapRef}
				initialViewState={{
					longitude:
						validPlaces[0]?.longitude ?? DEFAULT_CENTER.longitude,
					latitude:
						validPlaces[0]?.latitude ?? DEFAULT_CENTER.latitude,
					zoom: 4,
				}}
				mapStyle="https://tiles.openfreemap.org/styles/liberty"
				attributionControl={{ compact: true }}
				onClick={() => setPinnedKey(null)}
			>
				<NavigationControl
					position="bottom-right"
					showCompass={false}
				/>

				{groupedPlaces.map((group) => {
					const isActive = group.key === activeKey;
					const isPinned = group.key === pinnedKey;
					const label = group.places
						.map((p) => roleLabel(p.role))
						.join(" · ");

					return (
						<Marker
							key={group.key}
							longitude={group.longitude}
							latitude={group.latitude}
							anchor="center"
							// Le marker actif passe au-dessus des voisins
							style={{ zIndex: isActive ? 2 : 1 }}
							onClick={(event) => {
								event.originalEvent.stopPropagation();
								togglePin(group.key);
							}}
						>
							<button
								type="button"
								className={[
									"saint-map__marker",
									isActive && "saint-map__marker--active",
									isPinned && "saint-map__marker--pinned",
								]
									.filter(Boolean)
									.join(" ")}
								style={
									{
										"--marker-fill": markerBackground(
											group.places,
										),
										"--marker-color": roleColor(
											group.places[0].role,
										),
									} as React.CSSProperties
								}
								aria-label={`${label} : ${group.places[0].name}`}
								aria-pressed={isPinned}
								onMouseEnter={() => setHoveredKey(group.key)}
								onMouseLeave={() => setHoveredKey(null)}
								onFocus={() => setHoveredKey(group.key)}
								onBlur={() => setHoveredKey(null)}
							>
								<span className="saint-map__marker-dot" />
							</button>
						</Marker>
					);
				})}

				{activeGroup && (
					<Popup
						key={activeGroup.key}
						longitude={activeGroup.longitude}
						latitude={activeGroup.latitude}
						anchor="bottom"
						offset={16}
						closeButton={false}
						closeOnClick={false}
						className="saint-map__popup-wrap"
					>
						<div className="saint-map__popup">
							<strong className="saint-map__popup-name">
								{activeGroup.places[0].name}
								<span className="saint-map__popup-country">
									{activeGroup.places[0].country_code}
								</span>
							</strong>
							<ul className="saint-map__popup-roles">
								{activeGroup.places.map((p) => (
									<li
										key={`${p.role}-${p.code}`}
										style={
											{
												"--role-color": roleColor(
													p.role,
												),
											} as React.CSSProperties
										}
									>
										{roleLabel(p.role)}
									</li>
								))}
							</ul>
						</div>
					</Popup>
				)}
			</MapGL>

			<div className="saint-map__legend" aria-hidden="true">
				{legendRoles.map((role) => (
					<span key={role}>
						<i style={{ background: roleColor(role) }} />
						{roleLabel(role)}
					</span>
				))}
			</div>
		</div>
	);
}
