import type { TripId } from "@/data/trips";
import type { TripText } from "@/types/trips";

/**
 * Německé názvy a popisy výletů.
 *
 * U cílů, které mají zavedený německý název, uvádíme obojí ("Prebischtor
 * (Pravčická brána)") - podle německého jména je host najde v průvodci, podle
 * českého na rozcestníku. Výchozí body zůstávají česky ze stejného důvodu.
 */
export const tripTextDe: Readonly<Record<TripId, TripText>> = {
  "rozhledna-janov": {
    title: "Aussichtsturm Janov",
    startName: "Domeček Janov",
    summary:
      "Der Stahlturm von 2013 steht direkt im Ort. Hundertzweiundsechzig Stufen, oben ein 360°-Blick über die Böhmische und die Sächsische Schweiz.",
  },
  "bunkry-janov": {
    title: "Bunker bei Janov",
    startName: "Domeček Janov",
    summary:
      "Rundweg zu den Grenzbunkern aus den 1930er-Jahren. Vom Ort führen Waldwege an mehreren gut erhaltenen Kleinbunkern mit Infotafeln vorbei.",
  },
  hrensko: {
    title: "Hřensko (Herrnskretschen)",
    startName: "Domeček Janov",
    summary:
      "Der tiefstgelegene Ort Tschechiens und das Tor zum Nationalpark. Von hier starten die Wege in die Kamnitzklammen und zum Prebischtor.",
  },
  "ruzovsky-vrch": {
    title: "Růžovský vrch (Rosenberg)",
    startName: "Domeček Janov",
    summary:
      "Basaltkegel auf 619 m mit Durchblicken in die weite Umgebung. Von Janov führt die gelbe Markierung Hřensko - Srbská Kamenice hinauf.",
  },
  "pravcicka-brana": {
    title: "Prebischtor (Pravčická brána)",
    startName: "Mezní Louka",
    summary:
      "Das größte Sandsteintor Europas - 26,5 Meter hoch. Direkt darunter liegen die Aussichtsterrasse und das Restaurant Falkennest.",
    note: "Der rote Gabrielensteig ist nach dem Brand von 2022 weiterhin gesperrt, die Route führt deshalb über Tři prameny. Den aktuellen Stand vor der Tour auf npcs.cz prüfen.",
  },
  "divoka-soutesky": {
    title: "Wilde Klamm (Divoká soutěska)",
    startName: "Hřensko, zu den Klammen",
    summary:
      "Kahnfahrt durch die Kamnitzschlucht zwischen bis zu 150 Meter hohen Wänden. Die Boote fahren von Ostern bis Ende Oktober.",
    note: "Der Weg führt durch die Edmundsklamm, die wegen Felssicherung immer wieder gesperrt ist. Den aktuellen Stand finden Sie auf soutesky.cz.",
  },
  "mezni-louka": {
    title: "Mezní Louka (Rainwiese)",
    startName: "Hřensko",
    summary:
      "Siedlung mitten im Park und wichtigster Knotenpunkt der Wege. Großer Parkplatz, Bus aus Děčín, und von hier laufen die Markierungen in alle Richtungen.",
  },
  "labska-vyhlidka": {
    title: "Elbaussicht Belvedere",
    startName: "Bynovec",
    summary:
      "Felsenkanzel 130 Meter über der Elbschleife. Von Bynovec führt der Fürstenweg hinauf, auch mit Kindern machbar, und am Ziel gibt es meist eine Einkehr.",
  },
  "rozhledna-ruzenka": {
    title: "Aussichtsturm Růženka",
    startName: "Růžová",
    summary:
      "Betonturm auf dem Pastevní vrch, in der Form an Kaplickýs Bibliotheksentwurf erinnernd. Von Růžová ist es nur ein kurzes Stück, der Eintritt ist frei.",
  },
  "dolsky-mlyn": {
    title: "Grundmühle (Dolský mlýn)",
    startName: "Vysoká Lípa",
    summary:
      "Ruine einer Mühle aus dem 16. Jahrhundert am Ufer der Kamnitz, die älteste im ganzen Park. Der Weg führt schattig im Flusstal bergab.",
  },
  "mala-pravcicka-brana": {
    title: "Kleines Prebischtor",
    startName: "Vysoká Lípa",
    summary:
      "Die kleine Schwester des berühmten Tors, versteckt im tiefen Wald. Gelb bis zur Kreuzung Pod Šaunštejnem, dann rot - ohne Eintritt und ohne Schlange.",
  },
  saunstejn: {
    title: "Schauenstein (Šaunštejn)",
    startName: "Vysoká Lípa",
    summary:
      "Felsenburg aus dem 14. Jahrhundert, später Räuberversteck. Das letzte Stück geht über Leitern im Fels - bei Regen und Eis lieber ein anderes Ziel.",
  },
  "rudolfuv-kamen": {
    title: "Rudolfstein (Rudolfův kámen)",
    startName: "Vysoká Lípa",
    summary:
      "Aussicht auf einem Sandsteinfelsen in 484 Metern Höhe. Zum Schluss geht es über Eisenleitern und in den Fels geschlagene Stufen hinauf.",
  },
  "vileminina-stena": {
    title: "Wilhelminenwand (Vilemínina stěna)",
    startName: "Jetřichovice",
    summary:
      "Der fotogenste Aussichtspunkt der Dittersbacher Wände, auf der Kante einer fast senkrechten Wand. Der sanfte Anstieg durch den Wald ist auch für Ungeübte machbar.",
  },
  "mariina-vyhlidka": {
    title: "Marienfelsen (Mariina vyhlídka)",
    startName: "Jetřichovice",
    summary:
      "Felsvorsprung mit Geländer und einem Blick über mehr als 180 Grad. Der Weg von Jetřichovice ist mittelschwer und endet auf in den Fels gehauenen Stufen.",
  },
  falkenstejn: {
    title: "Falkenstein (Falkenštejn)",
    startName: "Jetřichovice",
    summary:
      "Felsenburg aus dem 13. Jahrhundert, der Name bedeutet Falkenstein. Der Aufstieg führt durch enge Spalten und über in den Sandstein geschlagene Treppen.",
  },
  "trpaslici-skaly": {
    title: "Zwergenfelsen (Trpasličí skály)",
    startName: "Jetřichovice",
    summary:
      "Labyrinth aus Felsgassen, Türmen und Überhängen - eine Miniatur der großen Felsenstädte. Für alle Winkel mindestens zwei Stunden einplanen.",
  },
  "pavlinino-udoli": {
    title: "Paulinengrund (Pavlínino údolí)",
    startName: "Jetřichovice",
    summary:
      "Das Tal der Chřibská Kamenice von Jetřichovice bis zur Siedlung Všemily. Kaum Höhenmeter, also auch für weniger geübte Gruppen.",
  },
  "kyjovske-udoli": {
    title: "Khaatal (Kyjovské údolí)",
    startName: "Kyjov bei Krásná Lípa",
    summary:
      "Lehrpfad durch das Tal der Kirnitzsch mit Holzstegen und Brücken über den Fluss. Leicht und für jedes Alter geeignet.",
  },
  "decinsky-sneznik": {
    title: "Aussichtsturm Hoher Schneeberg",
    startName: "Sněžník",
    summary:
      "Der älteste steinerne Aussichtsturm Böhmens von 1864, 33 Meter hoch. Von der Plattform reicht der Blick vom Erzgebirge bis ins Riesengebirge.",
  },
  "tiske-steny": {
    title: "Tyssaer Wände (Tiské stěny)",
    startName: "Tisá",
    summary:
      "Felsenstadt mit großem und kleinem Rundweg, hier wurden die Chroniken von Narnia gedreht. Die Runden im Fels selbst dauern zwei bis drei Stunden.",
  },
};
