package main

import (
	"github.com/gin-gonic/gin"
	"personal-finance-gin/config"
	"personal-finance-gin/controllers"
	"personal-finance-gin/middleware"
)
func main(){
	config.ConnectDB()

	r := gin.Default()
	r.POST("/register", controllers.Register)
	r.POST("/login",  controllers.Login)

	authorized := r.Group("/")
	authorized.Use(middleware.AuthMiddleware())
{
	authorized.POST("/workspaces", controllers.CreateWorkspace)
	authorized.GET("/workspaces", controllers.GetWorkspaces)
	authorized.GET("/workspaces/:id", controllers.GetWorkspacesByID)
	authorized.PUT("/workspaces/:id", controllers.UpdateWorkspace)
	authorized.POST("/categories", controllers.CreateCategory)
	authorized.GET("/categories", controllers.GetCategories)
	authorized.GET("/categories/:id", controllers.GetCategoryByID)
	authorized.PUT("/categories/:id", controllers.UpdateCategory)
	authorized.DELETE("/categories/:id", controllers.DeleteCategory)
	authorized.POST("/savings-goals", controllers.CreateSavingsGoal)
	authorized.GET("/savings-goals", controllers.GetSavingsGoals)
	authorized.PUT("/savings-goals/:id", controllers.UpdateSavingsGoal)
	authorized.DELETE("/savings-goals/:id", controllers.DeleteSavingsGoal)
	authorized.POST("/savings-goals/:id/deposit", controllers.CreateSavingsDeposit)
	authorized.GET("/savings-goals/:id/deposits", controllers.GetSavingsDeposits)
	authorized.PUT("/savings-goals/:id/deposits/:deposit_id", controllers.UpdateSavingsDeposit)
	authorized.DELETE("/savings-goals/:id/deposits/:deposit_id", controllers.DeleteSavingsDeposit)
	authorized.POST("/transactions", controllers.CreateTransaction)
	authorized.GET("/transactions", controllers.GetTransaction)
	authorized.GET("/transactions/:id", controllers.GetTransactionByID)
	authorized.PUT("/transactions/:id", controllers.Updatetransaction)
	authorized.DELETE("/transactions/:id", controllers.DeleteTransaction)
	authorized.GET("/summary", controllers.GetSummary)
}

	r.GET("/", func(c *gin.Context){
		c.JSON(200, gin.H{
			"message": "personal finance API running",
		})
	})
	r.Run(":8080")
}