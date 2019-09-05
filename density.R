library(ks)
library(ggplot2)
library(png)
library(ggpubr)
library(MASS)
library(dplyr)

raw_data <- read.table("Pos0_647nm_561nm_combined_clean.csv", sep = ",", header = F)
colnames(raw_data) <- c("X", "Y", "NA", "cellID", "gene")
raw_data$cellID <- as.numeric(raw_data$cellID)
cell_num <- max(raw_data$cellID)

pts_DT <- raw_data[,1:2]
pts_matrix <- as.matrix(pts_DT)

z <- kde2d(pts_DT[,1], pts_DT[,2], n=200, lims = c(range(0, 8192), range(0, 8192)))
contour(z, drawlabels=FALSE)
test <- contourLines(z)
total_length <- length(test)
dat <- data.frame()
for (i in 1:total_length) {
  df <- matrix(nrow = length(test[[i]][["x"]]), 
               ncol = 4, 
               dimnames = list(NULL, c("ID", "X", "Y", "level")))
  df[,1] <- i
  df[,2] <- test[[i]][["x"]]
  df[,3] <- test[[i]][["y"]]
  df[,4] <- test[[i]][["level"]]
  df <- as.data.frame(df)
  dat <- bind_rows(dat, df)
}
dat$level <- as.numeric(factor(dat$level))
write.table(dat, "KDE.csv" ,sep = ",", row.names = F, col.names = F)

dat <- data.frame()
for (j in 1:cell_num) {
  file_path <- paste0("cells/", j, ".csv")
  cell_raw_data <- read.table(file_path, header = F, sep = ",")
  x_min <- min(cell_raw_data[,1])
  x_max <- max(cell_raw_data[,1])
  y_min <- min(cell_raw_data[,2])
  y_max <- max(cell_raw_data[,2])
  z <- kde2d(cell_raw_data[,1], 
             cell_raw_data[,2], 
             n = 100,
             lims = c(range(x_min-30, x_max+30), range(y_min-30, y_max+30)))
  test <- contourLines(z, n = 4)
  total_length <- length(test)
  sc_data <- data.frame()
  for (i in 1:total_length) {
    df <- matrix(nrow = length(test[[i]][["x"]]), 
                 ncol = 4, 
                 dimnames = list(NULL, c("ID", "X", "Y", "level")))
    df[,1] <- paste0(j, "_", i)
    df[,2] <- test[[i]][["x"]]
    df[,3] <- test[[i]][["y"]]
    df[,4] <- test[[i]][["level"]]
    df <- as.data.frame(df)
    sc_data <- bind_rows(sc_data, df)
  }
  sc_data[,4] <- as.character(sc_data[,4])
  sc_data[,4] <- as.numeric(factor(sc_data[,4]))
  dat <- bind_rows(dat, sc_data)
}
dat$X <- as.numeric(dat$X)
dat$Y <- as.numeric(dat$Y)
dat$level <- as.numeric(dat$level)
write.table(dat, "sc_KDE.csv" ,sep = ",", row.names = F, col.names = F)
