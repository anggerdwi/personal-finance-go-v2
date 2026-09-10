package models

import (
	"gorm.io/gorm"
)

type Transaction struct {
	gorm.Model

	UserID      uint `json:"user_id"`
	WorkspaceID uint `json:"workspace_id"`
	CategoryID  uint `json:"category_id"`

	Category Category `json:"category"`

	Type   string  `json:"type" binding:"required,oneof=income expense"`
	Amount float64 `json:"amount" binding:"required,gt=0"`
	Notes  string  `json:"notes" binding:"max=255"`
}