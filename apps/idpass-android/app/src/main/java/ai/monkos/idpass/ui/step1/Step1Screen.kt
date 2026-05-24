package ai.monkos.idpass.ui.step1

import android.graphics.BitmapFactory
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.monkos.idpass.data.ContinentGroup
import ai.monkos.idpass.data.Country
import ai.monkos.idpass.data.CountryLoader
import ai.monkos.idpass.data.DocSpec
import ai.monkos.idpass.data.groupedByContinent
import ai.monkos.idpass.data.tr
import ai.monkos.idpass.ui.navigation.CropFlowViewModel
import ai.monkos.idpass.ui.theme.AccentButton
import ai.monkos.idpass.ui.theme.V1
import ai.monkos.idpass.ui.theme.V1TopBar

@Composable
fun Step1Screen(
    vm: CropFlowViewModel,
    onDocSelected: () -> Unit,
    onBack: () -> Unit,
    onHome: () -> Unit,
) {
    val context = LocalContext.current
    val lang = vm.flow.lang
    val purpose = vm.flow.purpose
    val countries = remember { CountryLoader.load(context) }
    val groups = remember(countries) { groupedByContinent(countries) }
    val isCustom = purpose == "custom"

    var searchQuery by remember { mutableStateOf("") }
    var selectedContinent by remember { mutableStateOf<String?>(null) }
    var expandedCountryId by remember { mutableStateOf<String?>(null) }

    // Custom mode state
    var customW by remember { mutableStateOf("35") }
    var customH by remember { mutableStateOf("45") }
    var customDpi by remember { mutableIntStateOf(300) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(V1.bg),
    ) {
        V1TopBar(currentStep = 1, onBack = onBack, onHome = onHome)

        // Title + Description
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(bottom = 12.dp),
        ) {
            Text(
                text = tr("select_country", lang),
                color = V1.text,
                fontSize = 22.sp,
                fontWeight = FontWeight.Black,
            )
            Spacer(Modifier.height(3.dp))
            Text(
                text = tr("select_desc", lang),
                color = V1.muted,
                fontSize = 11.sp,
            )
        }

        if (isCustom) {
            // ── Custom Input Form ──
            CustomInputSection(
                customW = customW,
                customH = customH,
                customDpi = customDpi,
                onWChange = { customW = it },
                onHChange = { customH = it },
                onDpiChange = { customDpi = it },
                lang = lang,
                onConfirm = {
                    val w = customW.toDoubleOrNull() ?: 35.0
                    val h = customH.toDoubleOrNull() ?: 45.0
                    val d = customDpi.toDouble()
                    val pxW = (w / 25.4 * d).toInt()
                    val pxH = (h / 25.4 * d).toInt()
                    vm.flow.selectedDoc = DocSpec(
                        id = "custom",
                        type = "custom",
                        names = mapOf("ko" to "커스텀", "en" to "Custom", "ja" to "カスタム"),
                        size = "${w.toInt()} × ${h.toInt()} mm",
                        px = "$pxW × $pxH px",
                        group = "X",
                        headHeight = "32–36 mm",
                        standard = "Custom",
                        docDpi = d,
                    )
                    vm.flow.selectedCountry = Country(
                        id = "custom",
                        flag = "🌐",
                        names = mapOf("ko" to "커스텀", "en" to "Custom", "ja" to "カスタム"),
                        docs = listOf(vm.flow.selectedDoc!!),
                    )
                    onDocSelected()
                },
            )
        } else {
            // ── Search Bar ──
            Row(
                modifier = Modifier
                    .padding(horizontal = 20.dp)
                    .padding(bottom = 10.dp)
                    .fillMaxWidth()
                    .background(V1.card, RoundedCornerShape(8.dp))
                    .border(1.dp, V1.border, RoundedCornerShape(8.dp))
                    .padding(horizontal = 12.dp, vertical = 9.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "🔍",
                    fontSize = 13.sp,
                    color = V1.dim,
                )
                Spacer(Modifier.width(8.dp))
                BasicTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    modifier = Modifier.weight(1f),
                    textStyle = TextStyle(
                        color = V1.text,
                        fontSize = 11.sp,
                    ),
                    singleLine = true,
                    cursorBrush = SolidColor(V1.accent),
                    decorationBox = { inner ->
                        if (searchQuery.isEmpty()) {
                            Text(
                                text = tr("search", lang),
                                color = V1.dim,
                                fontSize = 11.sp,
                            )
                        }
                        inner()
                    },
                )
            }

            // ── Content: Continent Grid / Country List ──
            val filteredCountries = if (searchQuery.isBlank()) {
                countries.filter { c ->
                    c.docs.any { it.type == purpose || (purpose == "passport" && it.type == "id") }
                }
            } else {
                val q = searchQuery.lowercase()
                countries.filter { c ->
                    c.docs.any { it.type == purpose || (purpose == "passport" && it.type == "id") } &&
                    (c.name(lang).lowercase().contains(q) || c.name("en").lowercase().contains(q))
                }
            }

            val filteredGroups = groupedByContinent(filteredCountries).filter { group ->
                group.countries.any { c ->
                    c.docs.any { it.type == purpose || (purpose == "passport" && it.type == "id") }
                }
            }

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (searchQuery.isNotBlank()) {
                    // Search results: 2-column grid of CountryCards
                    val matchingCountries = filteredCountries
                    TwoColumnCountryCards(
                        countries = matchingCountries,
                        lang = lang,
                        purpose = purpose,
                        expandedCountryId = expandedCountryId,
                        selectedCountryId = vm.flow.selectedCountry?.id,
                        selectedDocId = vm.flow.selectedDoc?.id,
                        onCountryClick = { c ->
                            expandedCountryId = if (expandedCountryId == c.id) null else c.id
                        },
                        onDocSelect = { c, doc ->
                            vm.flow.selectedCountry = c
                            vm.flow.selectedDoc = doc
                            onDocSelected()
                        },
                    )
                } else if (selectedContinent != null) {
                    // Back button + countries in continent
                    val group = filteredGroups.firstOrNull { it.id == selectedContinent }
                    if (group != null) {
                        Row(
                            modifier = Modifier
                                .clickable { selectedContinent = null }
                                .padding(vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = "❮",
                                color = V1.text,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                            )
                            Spacer(Modifier.width(6.dp))
                            Text(
                                text = group.name(lang),
                                color = V1.text,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                            )
                        }

                        val continentCountries = group.countries.filter { c ->
                            c.docs.any { it.type == purpose || (purpose == "passport" && it.type == "id") }
                        }
                        TwoColumnCountryCards(
                            countries = continentCountries,
                            lang = lang,
                            purpose = purpose,
                            expandedCountryId = expandedCountryId,
                            selectedCountryId = vm.flow.selectedCountry?.id,
                            selectedDocId = vm.flow.selectedDoc?.id,
                            onCountryClick = { c ->
                                expandedCountryId = if (expandedCountryId == c.id) null else c.id
                            },
                            onDocSelect = { c, doc ->
                                vm.flow.selectedCountry = c
                                vm.flow.selectedDoc = doc
                                onDocSelected()
                            },
                        )
                    }
                } else {
                    // Continent cards: 2-column grid
                    ContinentCardsGrid(
                        groups = filteredGroups,
                        lang = lang,
                        onContinentClick = { id -> selectedContinent = id },
                    )
                }

                Spacer(Modifier.height(32.dp))
            }
        }
    }
}

// ── Continent Cards Grid ──

@Composable
private fun ContinentCardsGrid(
    groups: List<ContinentGroup>,
    lang: String,
    onContinentClick: (String) -> Unit,
) {
    val context = LocalContext.current
    val rows = groups.chunked(2)

    rows.forEach { rowItems ->
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            rowItems.forEach { group ->
                ContinentCard(
                    group = group,
                    lang = lang,
                    onClick = { onContinentClick(group.id) },
                    modifier = Modifier.weight(1f),
                )
            }
            // Fill empty space if odd number
            if (rowItems.size == 1) {
                Spacer(Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun ContinentCard(
    group: ContinentGroup,
    lang: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val bitmap = remember(group.image) {
        try {
            context.assets.open("images/${group.image}.jpg").use {
                BitmapFactory.decodeStream(it)
            }
        } catch (_: Exception) {
            null
        }
    }

    Box(
        modifier = modifier
            .aspectRatio(1f)
            .clip(RoundedCornerShape(12.dp))
            .border(1.dp, V1.border, RoundedCornerShape(12.dp))
            .clickable { onClick() },
        contentAlignment = Alignment.BottomStart,
    ) {
        // Background image
        bitmap?.let { bmp ->
            Image(
                bitmap = bmp.asImageBitmap(),
                contentDescription = group.name(lang),
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize(),
            )
        }

        // Gradient overlay
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color.Black.copy(alpha = 0.4f),
                            Color.Black.copy(alpha = 0.2f),
                            Color.Black.copy(alpha = 0.7f),
                        ),
                    )
                ),
        )

        // Continent name bottom-left
        Text(
            text = (group.names["en"] ?: "").uppercase(),
            color = V1.accent.copy(alpha = 0.9f),
            fontSize = 18.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = 1.sp,
            modifier = Modifier.padding(12.dp),
        )
    }
}

// ── Two Column Country Cards ──

@Composable
private fun TwoColumnCountryCards(
    countries: List<Country>,
    lang: String,
    purpose: String,
    expandedCountryId: String?,
    selectedCountryId: String?,
    selectedDocId: String?,
    onCountryClick: (Country) -> Unit,
    onDocSelect: (Country, DocSpec) -> Unit,
) {
    val rows = countries.chunked(2)

    rows.forEach { rowItems ->
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            rowItems.forEach { c ->
                val matchDocs = c.docs.filter { it.type == purpose || (purpose == "passport" && it.type == "id") }
                val firstDoc = matchDocs.firstOrNull()
                if (firstDoc != null) {
                    Column(modifier = Modifier.weight(1f)) {
                        val sel = selectedCountryId == c.id && matchDocs.any { it.id == selectedDocId }
                        CountryCard(
                            country = c,
                            firstDoc = firstDoc,
                            lang = lang,
                            isSelected = sel,
                            onClick = {
                                val exactMatch = matchDocs.filter { it.type == purpose }
                                if (exactMatch.size == 1) {
                                    onDocSelect(c, exactMatch.first())
                                } else if (matchDocs.size == 1) {
                                    onDocSelect(c, matchDocs.first())
                                } else {
                                    onCountryClick(c)
                                }
                            },
                        )
                        // Expanded doc rows
                        AnimatedVisibility(visible = expandedCountryId == c.id && matchDocs.size > 0) {
                            Column(
                                modifier = Modifier.padding(top = 4.dp),
                                verticalArrangement = Arrangement.spacedBy(4.dp),
                            ) {
                                matchDocs.forEach { doc ->
                                    DocRow(
                                        doc = doc,
                                        lang = lang,
                                        isSelected = selectedDocId == doc.id,
                                        onClick = { onDocSelect(c, doc) },
                                    )
                                }
                            }
                        }
                    }
                }
            }
            if (rowItems.size == 1) {
                Spacer(Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun CountryCard(
    country: Country,
    firstDoc: DocSpec,
    lang: String,
    isSelected: Boolean,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                if (isSelected) V1.accent.copy(alpha = 0.06f) else V1.card,
                RoundedCornerShape(10.dp),
            )
            .border(
                1.dp,
                if (isSelected) V1.accent.copy(alpha = 0.4f) else V1.border,
                RoundedCornerShape(10.dp),
            )
            .clickable { onClick() }
            .padding(horizontal = 10.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(text = country.flag, fontSize = 22.sp)
        Spacer(Modifier.width(8.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = country.name(lang),
                color = V1.text,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Spacer(Modifier.height(1.dp))
            Text(
                text = "${firstDoc.name(lang)} · ${firstDoc.size.replace(" mm", "")}",
                color = V1.dim,
                fontSize = 8.sp,
                fontFamily = FontFamily.Monospace,
            )
        }
    }
}

@Composable
private fun DocRow(
    doc: DocSpec,
    lang: String,
    isSelected: Boolean,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                if (isSelected) V1.accent.copy(alpha = 0.06f) else V1.card,
                RoundedCornerShape(10.dp),
            )
            .border(
                1.dp,
                if (isSelected) V1.accent.copy(alpha = 0.4f) else V1.border,
                RoundedCornerShape(10.dp),
            )
            .clickable { onClick() }
            .padding(horizontal = 10.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = doc.name(lang),
                color = V1.text,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Spacer(Modifier.height(1.dp))
            Text(
                text = "${doc.size} · ${doc.standard}",
                color = V1.dim,
                fontSize = 8.sp,
                fontFamily = FontFamily.Monospace,
            )
        }
    }
}

// ── Custom Input Section ──

@Composable
private fun CustomInputSection(
    customW: String,
    customH: String,
    customDpi: Int,
    onWChange: (String) -> Unit,
    onHChange: (String) -> Unit,
    onDpiChange: (Int) -> Unit,
    lang: String,
    onConfirm: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp)
            .verticalScroll(rememberScrollState()),
    ) {
        Spacer(Modifier.height(16.dp))

        // W x H input
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center,
            modifier = Modifier.fillMaxWidth(),
        ) {
            // Width
            Column(horizontalAlignment = Alignment.Start) {
                Text(
                    text = tr("width", lang),
                    color = V1.muted,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                )
                Spacer(Modifier.height(4.dp))
                Row(
                    modifier = Modifier
                        .background(V1.card, RoundedCornerShape(8.dp))
                        .border(1.dp, V1.border, RoundedCornerShape(8.dp))
                        .padding(horizontal = 10.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    BasicTextField(
                        value = customW,
                        onValueChange = onWChange,
                        modifier = Modifier.width(50.dp),
                        textStyle = TextStyle(
                            color = V1.text,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace,
                        ),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        cursorBrush = SolidColor(V1.accent),
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(text = "mm", color = V1.dim, fontSize = 10.sp)
                }
            }

            Spacer(Modifier.width(10.dp))
            Text(
                text = "×",
                color = V1.dim,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(top = 16.dp),
            )
            Spacer(Modifier.width(10.dp))

            // Height
            Column(horizontalAlignment = Alignment.Start) {
                Text(
                    text = tr("height", lang),
                    color = V1.muted,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                )
                Spacer(Modifier.height(4.dp))
                Row(
                    modifier = Modifier
                        .background(V1.card, RoundedCornerShape(8.dp))
                        .border(1.dp, V1.border, RoundedCornerShape(8.dp))
                        .padding(horizontal = 10.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    BasicTextField(
                        value = customH,
                        onValueChange = onHChange,
                        modifier = Modifier.width(50.dp),
                        textStyle = TextStyle(
                            color = V1.text,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace,
                        ),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        cursorBrush = SolidColor(V1.accent),
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(text = "mm", color = V1.dim, fontSize = 10.sp)
                }
            }
        }

        Spacer(Modifier.height(12.dp))

        // DPI selector
        Column {
            Text(
                text = "DPI",
                color = V1.muted,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(4.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                listOf(72, 300, 600).forEach { dpi ->
                    val sel = customDpi == dpi
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(36.dp)
                            .background(
                                if (sel) V1.accent else V1.card,
                                RoundedCornerShape(8.dp),
                            )
                            .border(
                                1.dp,
                                if (sel) V1.accent else V1.border,
                                RoundedCornerShape(8.dp),
                            )
                            .clickable { onDpiChange(dpi) },
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = "$dpi",
                            color = if (sel) Color(0xFF05080E) else V1.muted,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace,
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(12.dp))

        // Output display
        val cw = customW.toDoubleOrNull() ?: 35.0
        val ch = customH.toDoubleOrNull() ?: 45.0
        val cpx = (cw / 25.4 * customDpi).toInt()
        val cpy = (ch / 25.4 * customDpi).toInt()

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(V1.card, RoundedCornerShape(8.dp))
                .border(1.dp, V1.border, RoundedCornerShape(8.dp))
                .padding(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = tr("output", lang),
                color = V1.muted,
                fontSize = 10.sp,
            )
            Spacer(Modifier.weight(1f))
            Text(
                text = "$cpx × $cpy px",
                color = V1.accent,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
            )
        }

        Spacer(Modifier.weight(1f))

        // Confirm button
        AccentButton(
            text = "${tr("use_spec", lang)} →",
            onClick = onConfirm,
            modifier = Modifier
                .padding(top = 8.dp, bottom = 12.dp),
        )
    }
}
