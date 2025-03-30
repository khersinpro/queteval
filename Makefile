.PHONY: start open-admin

start:
	docker-compose down
	docker-compose up -d --build

open-admin:
	@echo "Quelle interface souhaitez-vous ouvrir ?"
	@echo "1) phpMyAdmin (MySQL)"
	@echo "2) Mongo Express"
	@echo "3) Les deux"
	@read -p "Votre choix (1, 2 ou 3) : " choice; \
	case $$choice in \
		1) \
			echo "Ouverture de phpMyAdmin..." && \
			open http://localhost:8080 ;; \
		2) \
			echo "Ouverture de Mongo Express..." && \
			open http://localhost:8081 ;; \
		3) \
			echo "Ouverture des deux interfaces..." && \
			open http://localhost:8080 && \
			open http://localhost:8081 ;; \
		*) \
			echo "Choix invalide" ;; \
	esac 