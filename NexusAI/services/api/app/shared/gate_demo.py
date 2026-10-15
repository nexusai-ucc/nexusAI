"""Código de prueba para TPC-02 (#574): NO MERGEAR.

Este módulo existe solo para demostrar que el quality gate bloquea un PR con
código nuevo sin tests (cobertura < 80 %) y con bloques duplicados. El PR se
cierra sin mergear.
"""


def resumen_notas_curso_a(notas: list[float]) -> dict[str, float]:
    if not notas:
        return {"promedio": 0.0, "maxima": 0.0, "minima": 0.0, "aprobados": 0.0}
    total = 0.0
    maxima = notas[0]
    minima = notas[0]
    aprobados = 0
    for nota in notas:
        total += nota
        if nota > maxima:
            maxima = nota
        if nota < minima:
            minima = nota
        if nota >= 4:
            aprobados += 1
    promedio = total / len(notas)
    porcentaje = aprobados * 100 / len(notas)
    return {"promedio": promedio, "maxima": maxima, "minima": minima, "aprobados": porcentaje}


def resumen_notas_curso_b(notas: list[float]) -> dict[str, float]:
    if not notas:
        return {"promedio": 0.0, "maxima": 0.0, "minima": 0.0, "aprobados": 0.0}
    total = 0.0
    maxima = notas[0]
    minima = notas[0]
    aprobados = 0
    for nota in notas:
        total += nota
        if nota > maxima:
            maxima = nota
        if nota < minima:
            minima = nota
        if nota >= 4:
            aprobados += 1
    promedio = total / len(notas)
    porcentaje = aprobados * 100 / len(notas)
    return {"promedio": promedio, "maxima": maxima, "minima": minima, "aprobados": porcentaje}
