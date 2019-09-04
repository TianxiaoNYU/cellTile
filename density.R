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
  test <- contourLines(z, n =4)
  total_length <- length(test)
  # dat <- data.frame()
  for (i in 1:total_length) {
    df <- matrix(nrow = length(test[[i]][["x"]]), 
                 ncol = 4, 
                 dimnames = list(NULL, c("ID", "X", "Y", "level")))
    df[,1] <- paste0(j, "_", i)
    df[,2] <- test[[i]][["x"]]
    df[,3] <- test[[i]][["y"]]
    df[,4] <- test[[i]][["level"]]
    df <- as.data.frame(df)
    dat <- bind_rows(dat, df)
  }
  # output_file_path <- paste0("cells/", j, "_KDE.csv")
  # write.table(dat, output_file_path ,sep = ",", row.names = F, col.names = F)
}
dat$X <- as.numeric(dat$X)
dat$Y <- as.numeric(dat$Y)
write.table(dat, "sc_KDE.csv" ,sep = ",", row.names = F, col.names = F)






# p <- kde(pts_matrix)
# par(bg = NA)
# plot(p)
# 
# img <- readPNG("image_tiles/0/map_0_0.png")
# q <- ggplot(data = pts_DT, aes(x = V1, y = V2, fill = stat(level))) +
#       background_image(img) + 
#       scale_x_continuous(limits = c(0, 8192), expand = c(0, 0)) +
#       scale_y_continuous(limits = c(-8192, 0), expand = c(0, 0)) + 
#       stat_density_2d(aes(fill = stat(level)), 
#                       geom = "polygon", 
#                       show.legend = FALSE, 
#                       h = c(150, 150),
#                       n = 200) +
#       theme(
#         panel.grid.minor = element_blank(),
#         panel.grid.major = element_blank(),
#         plot.background = element_rect(fill = "transparent",colour = NA),
#         axis.title = element_blank(),
#         axis.text = element_blank(),
#         axis.ticks = element_blank()
#         )
# q
# ggsave(q, filename = "tr_tst2.png",  bg = "transparent")
