package database

import (
	"magic/backend/internal/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Connect(config *config.Config) (*gorm.DB, error) {
	dsn := config.DatabaseURL
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	database, err := db.DB()
	if err != nil {
		return nil, err
	}
	database.SetMaxIdleConns(10)
	database.SetMaxOpenConns(100)
	return db, nil
}
