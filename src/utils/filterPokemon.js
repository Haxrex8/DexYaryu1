export function filterPokemon(
  pokedex,
  { search = "", type = "" } = {}
) {
  const query = search.toLowerCase().trim();
  const typeQuery = type.toLowerCase().trim();

  return pokedex.filter(entry => {
    const forms = Object.values(entry.forms || {});

    const allText = [
      entry.name,
      entry.speciesId,
      ...(entry.family || []),
      ...forms.flatMap(f => [f?.name, f?.fullName])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchSearch = !query || allText.includes(query);

    const matchType =
      !typeQuery ||
      forms.some(f =>
        (f?.types || [])
          .map(t => t.toLowerCase())
          .includes(typeQuery)
      );

    return matchSearch && matchType;
  });
}