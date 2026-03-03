package controllers

import(
	"net/http"
	"personal-finance-gin/config"
	"personal-finance-gin/models"
	"github.com/gin-gonic/gin"
	"strconv"

)

func CreateTransaction(c *gin.Context){

	var input models.Transaction

	UserID, exists := c.Get("user_id")
	if !exists{
		c.JSON(http.StatusUnauthorized, gin.H{
			"error" : "unauthorized!",
		})
		return
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error" : err.Error(),
		})
		return
	}
	input.UserID = UserID.(uint)

	if input.Type == "expense"{
		input.Amount = -input.Amount
	}
	if err := config.DB.Create(&input).Error; err != nil{
		c.JSON(http.StatusInternalServerError, gin.H{
			"error" : err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message" : "transaction created succesfully!",
		"data" : input,
	})
}

func GetTransaction(c *gin.Context){
	var transactions []models.Transaction

	UserID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error" : "unauthorized!",
		})
		return
	}

	typeFilter := c.Query("type")
	minAmount := c.Query("min_amount")

	// pagination
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "1")

	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)

	offset := (page - 1) * limit

	query := config.DB.Model(&models.Transaction{}).
		Where("user_id = ?", UserID)

	// filter by type
	if typeFilter != ""{
		query = query.Where("type = ?", typeFilter)
	}
	// filter minimum amount
	minAmountInt, err := strconv.Atoi(minAmount)
	if err == nil{
		query = query.Where("ABS(amount) >= ?", minAmountInt)
	}

	if err := query.
	Limit(limit).
	Offset(offset).
	Find(&transactions).Error; err != nil{
		c.JSON(http.StatusInternalServerError, gin.H{
			"error" : err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"page" : page,
		"limit" : limit,
		"data" : transactions,
	})
}

func GetTransactionByID(c *gin.Context){
	id := c.Param("id")
	var transaction models.Transaction

	if err := config.DB.First(&transaction, id).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{
			"error" : "Transaction not found!",
	})
	} 
	c.JSON(http.StatusOK, gin.H{
		"data" : transaction,
	})
}

func Updatetransaction(c *gin.Context){
	id := c.Param("id")

	var transaction models.Transaction

	UserID, exists := c.Get("user_id")
	if !exists{
		c.JSON(http.StatusUnauthorized, gin.H{
			"error" : "unauthorized!",
		})
		return
	}

	if err := config.DB.Where("id = ? AND user_id = ?", id, UserID).
		First(&transaction, id).Error; err != nil{
		c.JSON(http.StatusNotFound, gin.H{
			"error" : "transaction not found!",
		})
		return
	}
	var input models.Transaction
	if err := c.ShouldBindJSON(&input); err != nil{
		c.JSON(http.StatusBadRequest, gin.H{
			"error" : err.Error(),
		})
		return
	}

	// UPDATE
	transaction.Type = input.Type
	transaction.Amount = input.Amount
	transaction.Notes = input.Notes

	config.DB.Save(&transaction)

	c.JSON(http.StatusOK, gin.H{
		"message" : "Transaction updated succesfully!",
		"data" : transaction,
	})
}

func DeleteTransaction(c *gin.Context){
	id := c.Param("id")

	var transaction models.Transaction
	
	UserID, exists := c.Get("user_id")
	if !exists{
		c.JSON(http.StatusUnauthorized, gin.H{
			"error" : "unauthorized!",
		})
		return
	}

	if err := config.DB.Where("id = ? AND user_id = ?", id, UserID).First(&transaction, id).Error; err != nil{
		c.JSON(http.StatusNotFound, gin.H{
			"error" : "Transaction not found!",
		})
		return
	}

	if err := config.DB.Delete(&transaction).Error; err != nil{
		c.JSON(http.StatusInternalServerError, gin.H{
			"error" : "Failed to delete transaction",
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message" : "transaction deleted succesfully!",
	})
}

func GetSummary(c *gin.Context){
	var totalIncome float64
	var totalExpense float64
	var balance float64

	UserID, exists := c.Get("user_id")
	if !exists{
	c.JSON(http.StatusUnauthorized, gin.H{
		"error" : "unauthorized!",
	})
		return
	}
	config.DB.Model(&models.Transaction{}).
	Where("user_id = ? AND amount > 0", UserID).
	Select("COALESCE(SUM(amount),0)").
	Scan(&totalIncome)

	config.DB.Model(&models.Transaction{}).
	Where("user_id = ? AND amount < 0", UserID).
	Select("COALESCE(SUM(amount),0)").
	Scan(&totalExpense)

	config.DB.Model(&models.Transaction{}).
	Where("user_id = ?", UserID).
	Select("COALESCE(SUM(amount),0)").
	Scan(&balance)

	c.JSON(http.StatusOK, gin.H{
		"total_Income": totalIncome,
		"total_Expense": -totalExpense,
		"balance": balance,
	})
}
	
