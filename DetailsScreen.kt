package com.cinematixapp.app.ui

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.cinematixapp.app.MovieCard
import com.cinematixapp.app.data.*
import com.cinematixapp.app.ui.theme.*

@Composable
fun DetailsScreen(
    contentId: String,
    onBackClick: () -> Unit,
    onContentClick: (String, String) -> Unit,
    onPlayClick: (String, String) -> Unit,
) {
    val viewModel: DetailsViewModel = viewModel(
        factory = DetailsViewModelFactory(contentId)
    )

    val uiState by viewModel.uiState.collectAsState()
    val selectedSeason by viewModel.selectedSeason.collectAsState()
    val selectedTab by viewModel.selectedTab.collectAsState()

    val detailsBackgroundColor = Color(0xFF141B29)

    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        Box(modifier = Modifier.fillMaxSize().background(detailsBackgroundColor)) {
            when (val state = uiState) {
                is DetailsUiState.Loading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center),
                        color = CinematixGradientGreen
                    )
                }
                is DetailsUiState.Success -> {
                    DetailsContent(
                        content = state.content,
                        selectedSeason = selectedSeason,
                        selectedTab = selectedTab,
                        similarContent = state.similarContent,
                        backgroundColor = detailsBackgroundColor,
                        onSeasonSelect = { viewModel.selectSeason(it) },
                        onTabSelect = { viewModel.selectTab(it) },
                        onBackClick = onBackClick,
                        onContentClick = onContentClick,
                        onPlayClick = onPlayClick
                    )
                }
                is DetailsUiState.Error -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(text = state.message, color = Color.White)
                            Spacer(Modifier.height(16.dp))
                            Button(
                                onClick = { viewModel.loadDetails(contentId) },
                                colors = ButtonDefaults.buttonColors(containerColor = CinematixGradientGreen)
                            ) {
                                Text("إعادة المحاولة", color = Color.Black)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DetailsContent(
    content: Content,
    selectedSeason: Season?,
    selectedTab: String,
    similarContent: List<Content>,
    backgroundColor: Color,
    onSeasonSelect: (Season) -> Unit,
    onTabSelect: (String) -> Unit,
    onBackClick: () -> Unit,
    onContentClick: (String, String) -> Unit,
    onPlayClick: (String, String) -> Unit,
) {
    val context = LocalContext.current
    val config = LocalConfiguration.current
    val screenHeight = config.screenHeightDp.dp
    val heroHeight = screenHeight * 0.45f

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 32.dp)
    ) {
        // 1. Hero Region
        item {
            Box(modifier = Modifier.fillMaxWidth().height(heroHeight)) {
                // Backdrop Image
                AsyncImage(
                    model = ImageRequest.Builder(context)
                        .data(selectedSeason?.backdrop?.ifEmpty { content.displayBackdrop } ?: content.displayBackdrop)
                        .crossfade(true)
                        .build(),
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )

                // Overlay Gradient
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                0.0f to Color.Transparent,
                                0.6f to backgroundColor.copy(alpha = 0.4f),
                                1.0f to backgroundColor,
                                startY = 0f,
                                endY = Float.POSITIVE_INFINITY
                            )
                        )
                )

                // Back Button
                IconButton(
                    onClick = onBackClick,
                    modifier = Modifier
                        .statusBarsPadding()
                        .padding(16.dp)
                        .clip(CircleShape)
                        .background(Color.Black.copy(0.4f))
                ) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                }

                // 2. Logo / Title
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 20.dp),
                    contentAlignment = Alignment.Center
                ) {
                    val logoUrl = selectedSeason?.logoUrl?.ifEmpty { content.logoUrl } ?: content.logoUrl
                    if (content.isLogoEnabled && logoUrl.isNotEmpty()) {
                        AsyncImage(
                            model = logoUrl,
                            contentDescription = content.title,
                            modifier = Modifier
                                .height(100.dp)
                                .fillMaxWidth(0.7f),
                            contentScale = ContentScale.Fit
                        )
                    } else {
                        Text(
                            text = content.title,
                            color = Color.White,
                            fontSize = 32.sp,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(horizontal = 20.dp)
                        )
                    }
                }
            }
        }

        // 3. Main Info & Actions Section
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Action Buttons (Watch Now & My List)
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Watch Now
                    Button(
                        onClick = { onPlayClick(content.safeId, content.type) },
                        modifier = Modifier
                            .weight(1f)
                            .height(52.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                        contentPadding = PaddingValues(0.dp),
                        shape = CircleShape
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.horizontalGradient(listOf(CinematixCyan, CinematixGradientGreen))
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.PlayArrow, contentDescription = null, tint = Color.Black)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("شاهد الآن", color = Color.Black, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                            }
                        }
                    }

                    // My List Button
                    Button(
                        onClick = { /* My List Logic */ },
                        modifier = Modifier
                            .weight(1f)
                            .height(52.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(0.1f)),
                        shape = CircleShape,
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.2f))
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Add, contentDescription = null, tint = Color.White)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("قائمتي", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // 4. Stylized Divider & Header
                if (content.bannerNote.isNotEmpty()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Start
                    ) {
                        Box(
                            modifier = Modifier
                                .width(4.dp)
                                .height(24.dp)
                                .background(CinematixGradientGreen)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = content.bannerNote,
                            color = Color.White,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Right
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                // 5. Season Selector
                if (content.type == "series" && content.seasons.isNotEmpty()) {
                    SeasonDropdown(
                        seasons = content.seasons,
                        selectedSeason = selectedSeason,
                        onSeasonSelect = onSeasonSelect
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                }

                // 6. Metadata
                val searchGenre = content.categories.firstOrNull() ?: ""
                val metadataItems = mutableListOf<String>()
                if (content.type == "series") metadataItems.add("الموسم ${selectedSeason?.safeSeasonNumber ?: 1}")
                if (searchGenre.isNotEmpty()) metadataItems.add(searchGenre)

                // النقاط بين الأقسام خضراء
                Text(
                    text = buildAnnotatedString {
                        metadataItems.forEachIndexed { index, item ->
                            append(item)
                            if (index < metadataItems.size - 1) {
                                withStyle(style = SpanStyle(color = CinematixGradientGreen, fontWeight = FontWeight.Bold)) {
                                    append("  •  ")
                                }
                            }
                        }
                    },
                    color = Color.Gray,
                    fontSize = 13.sp,
                    textAlign = TextAlign.Right,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Description
                Text(
                    text = selectedSeason?.description?.ifEmpty { content.description } ?: content.description,
                    color = Color.White.copy(alpha = 0.9f),
                    fontSize = 14.sp,
                    textAlign = TextAlign.Right,
                    lineHeight = 22.sp,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Cast (Max 4 as requested)
                if (content.cast.isNotEmpty()) {
                    Text(
                        text = "النجوم: ${content.cast.take(4).joinToString("، ")}",
                        color = Color.Gray,
                        fontSize = 13.sp,
                        textAlign = TextAlign.Right,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                Spacer(modifier = Modifier.height(32.dp))
            }
        }

        // 7. Tabs Layout
        item {
            val episodesCount = selectedSeason?.episodes?.size ?: 0
            val tabs = if (content.type == "series") {
                listOf("الحلقات ($episodesCount)", "إعلان", "التفاصيل", "أعمال مشابهة")
            } else {
                listOf("المشاهدة", "إعلان", "التفاصيل", "أعمال مشابهة")
            }

            Column {
                ScrollableTabRow(
                    selectedTabIndex = tabs.indexOfFirst { it.contains(selectedTab.substringBefore(" (")) }.coerceAtLeast(0),
                    containerColor = Color.Transparent,
                    contentColor = CinematixGradientGreen,
                    edgePadding = 20.dp,
                    divider = {},
                    indicator = { tabPositions ->
                        val index = tabs.indexOfFirst { it.contains(selectedTab.substringBefore(" (")) }.coerceAtLeast(0)
                        if (index < tabPositions.size) {
                            TabRowDefaults.SecondaryIndicator(
                                modifier = Modifier.tabIndicatorOffset(tabPositions[index]),
                                color = CinematixGradientGreen // الخط الأخضر
                            )
                        }
                    }
                ) {
                    tabs.forEach { tab ->
                        val isSelected = selectedTab.substringBefore(" (") == tab.substringBefore(" (")
                        Tab(
                            selected = isSelected,
                            onClick = { onTabSelect(tab) },
                            text = {
                                Text(
                                    text = tab,
                                    fontSize = 14.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                    color = if (isSelected) Color.White else Color.Gray
                                )
                            },
                            selectedContentColor = Color.White,
                            unselectedContentColor = Color.Gray
                        )
                    }
                }
                HorizontalDivider(color = Color.White.copy(0.1f), thickness = 0.5.dp)
            }
        }

        // 8. Tab Content
        val cleanTab = selectedTab.substringBefore(" (")
        when {
            cleanTab == "الحلقات" || cleanTab == "المشاهدة" -> {
                val episodes = selectedSeason?.episodes ?: emptyList()
                if (episodes.isEmpty()) {
                    item {
                        Column(
                            modifier = Modifier.fillMaxWidth().padding(40.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("لا توجد حلقات متاحة حالياً", color = Color.Gray, fontSize = 16.sp)
                        }
                    }
                } else {
                    items(episodes.sortedBy { it.safeEpisodeNumber }) { episode ->
                        val fallbackImage = selectedSeason?.backdrop?.ifEmpty { content.displayBackdrop } ?: content.displayBackdrop
                        GlassyEpisodeCard(
                            episode = episode,
                            fallbackImage = fallbackImage,
                            onPlay = { onPlayClick(episode.safeId, "episode") }
                        )
                    }
                }
            }

            cleanTab == "إعلان" -> {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp)
                            .height(200.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.White.copy(alpha = 0.05f))
                            .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(12.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.PlayCircleFilled, contentDescription = null, tint = CinematixGradientGreen, modifier = Modifier.size(48.dp))
                            Spacer(Modifier.height(12.dp))
                            Text("شاهد الإعلان الترويجي", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            cleanTab == "التفاصيل" -> {
                item {
                    Column(Modifier.padding(20.dp).fillMaxWidth()) {
                        Text("قصة العمل", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(8.dp))
                        Text(text = content.description, color = Color.Gray, fontSize = 14.sp, lineHeight = 22.sp)
                        
                        Spacer(Modifier.height(24.dp))
                        
                        if (content.categories.isNotEmpty()) {
                            Text("الجنسية:", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(4.dp))
                            Text(text = content.categories.joinToString("، "), color = Color.Gray, fontSize = 14.sp)
                            Spacer(Modifier.height(16.dp))
                        }

                        if (content.genres.isNotEmpty()) {
                            Text("التصنيف:", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(4.dp))
                            Text(text = content.genres.joinToString("، "), color = Color.Gray, fontSize = 14.sp)
                            Spacer(Modifier.height(16.dp))
                        }

                        if (content.cast.isNotEmpty()) {
                            Text("طاقم العمل:", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(4.dp))
                            Text(text = content.cast.joinToString("، "), color = Color.Gray, fontSize = 14.sp)
                        }
                        
                        // ملاحظة: قمت بافتراض وجود \`director\` و \`writer\` في مودل Content
                        // إذا لزم الأمر وكانا موجودين، يمكنك إضافة هذا الجزء عن طريق إزالة التعليقات
                        /*
                        Spacer(Modifier.height(16.dp))
                        
                        if (content.director.isNotEmpty()) {
                            Text("المخرج:", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(4.dp))
                            Text(text = content.director, color = Color.Gray, fontSize = 14.sp)
                            Spacer(Modifier.height(16.dp))
                        }

                        if (content.writer.isNotEmpty()) {
                            Text("المؤلف:", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(4.dp))
                            Text(text = content.writer, color = Color.Gray, fontSize = 14.sp)
                        }
                        */
                    }
                }
            }

            cleanTab == "أعمال مشابهة" -> {
                item {
                    LazyRow(
                        modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                        contentPadding = PaddingValues(horizontal = 20.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(similarContent) { similar ->
                            MovieCard(content = similar, onClick = onContentClick)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SeasonDropdown(
    seasons: List<Season>,
    selectedSeason: Season?,
    onSeasonSelect: (Season) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .clickable { expanded = true }
                .padding(vertical = 12.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "الموسم ${selectedSeason?.safeSeasonNumber ?: 1}",
                color = Color.White,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.width(8.dp))
            Icon(Icons.Default.KeyboardArrowDown, contentDescription = null, tint = Color.White)
        }

        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
            modifier = Modifier
                .fillMaxWidth(0.5f)
                .heightIn(max = 240.dp) // هذا يحدد الطول ويجعلها تنزل لأسفل بشكل أفضل
                .background(Color(0xFF1F2937))
                .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
        ) {
            seasons.sortedBy { it.safeSeasonNumber }.forEach { season ->
                DropdownMenuItem(
                    text = {
                        Text(
                            "الموسم ${season.safeSeasonNumber}",
                            color = if (season.safeSeasonNumber == selectedSeason?.safeSeasonNumber) CinematixGradientGreen else Color.White,
                            fontWeight = if (season.safeSeasonNumber == selectedSeason?.safeSeasonNumber) FontWeight.Bold else FontWeight.Normal
                        )
                    },
                    onClick = {
                        onSeasonSelect(season)
                        expanded = false
                    }
                )
            }
        }
    }
}

@Composable
fun GlassyEpisodeCard(
    episode: Episode,
    fallbackImage: String,
    onPlay: () -> Unit
) {
    val displayNum = if (episode.safeEpisodeNumber <= 0) 1 else episode.safeEpisodeNumber

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 8.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(Color.White.copy(alpha = 0.05f))
            .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
            .clickable { onPlay() }
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Episode Thumbnail
            Box(
                modifier = Modifier
                    .size(width = 120.dp, height = 70.dp)
                    .clip(RoundedCornerShape(8.dp))
            ) {
                AsyncImage(
                    model = episode.thumbnail.ifEmpty { episode.poster.ifEmpty { fallbackImage } },
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
                // Play Icon
                Box(
                    modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.3f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
                }
            }

            Spacer(Modifier.width(16.dp))

            // Episode Info
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "الحلقة $displayNum",
                    color = CinematixGradientGreen, // غيرت من ازرق لأخضر مثل التبويبات
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = episode.title.ifEmpty { "عنوان الحلقة $displayNum" },
                    color = Color.White,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = episode.description.ifEmpty { "شاهد أحداث الحلقة $displayNum بجودة عالية" },
                    color = Color.Gray,
                    fontSize = 11.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}
