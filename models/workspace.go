package models

import "gorm.io/gorm"

type Workspace struct {
	gorm.Model

	UserID      uint   `json:"user_id"`
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}