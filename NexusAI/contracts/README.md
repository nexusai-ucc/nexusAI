# Contratos entre el plugin y el backend (TPC-07, #579)

Fuente única de verdad para las dos puntas de la integración plugin ↔ backend. Los leen tests de los dos lados:

| Archivo | Productor (backend) | Consumidor (plugin) |
|---|---|---|
| `hmac_vectors.json` | `services/api/tests/test_contract_hmac.py`: el `verify_hmac` real acepta cada vector | `plugin/local/nexusai/tests/contract_test.php`: `backend_client::compute_signature` produce la misma firma |
| `responses/*.json` | `services/api/tests/test_contract_responses.py`: cada respuesta valida contra el modelo Pydantic real y no tiene campos que el modelo no declare | `contract_test.php`: el web service que la consume la procesa y su resultado valida contra `execute_returns()` |

Si alguien cambia el algoritmo de firma o un campo de una respuesta de un lado sin actualizar el contrato, falla el CI de ese lado. Las claves que empiezan con `_` son metadatos y no forman parte de la respuesta.
