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
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
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
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.monkos.idpass.data.ContinentGroup
import ai.monkos.idpass.data.Country
import ai.monkos.idpass.data.CountryLoader
import ai.monkos.idpass.data.DocSpec
import ai.monkos.idpass.data.continentMeta
import ai.monkos.idpass.data.groupedByContinent
import ai.monkos.idpass.data.purposeList
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
    val countries = remember { CountryLoader.load(context) }
    val groups = remember(countries) { groupedByContinent(countries) }

    var searchQuery by remember { mutableStateOf("") }
    var expandedContinent by remember { mutableStateOf<String?>(null) }
    var selectedCountry by remember { mutableStateOf<Country?>(null) }
    var showDocPicker by remember { mutableStateOf(false) }

    // Custom mode state
    var customW by remember { mutableStateOf("35") }
    var customH by remember { mutableStateOf("45") }
    var customDpi by remember { mutableStateOf("300") }

    // Purpose filter
    val purposeIndex = purposeList.indexOf(vm.flow.purpose).coerceAtLeast(0)
    var selectedPurposeIdx by remember { mutableIntStateOf(purposeIndex) }
    val isCustom = purposeList.getOrNull(selectedPurposeIdx) == "custom"

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(V1.bg),
    ) {
        V1TopBar(currentStep = 1, onBack = onBack, onHome = onHome)

        // Purpose filter tabs
        ScrollableTabRow(
            selectedTabIndex = selectedPurposeIdx,
            containerColor = V1.bg,
            contentColor = V1.accent,
            edgePadding = 16.dp,
            divider = {},
            indicator = {},
        ) {
            purposeList.forEachIndexed { index, purpose ->
                val isSelected = index == selectedPurposeIdx
                Tab(
                    selected = isSelected,
                    onClick = {
                        selectedPurposeIdx = index
                        vm.flow.purpose = purpose
                    },
                    modifier = Modifier.padding(horizontal = 4.dp),
                ) {
                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = if (isSelected) V1.accent else V1.card,
                        modifier = Modifier.padding(vertical = 8.dp),
                    ) {
                        Text(
                            text = tr(purpose, lang),
                            color = if (isSelected) V1.bg else V1.muted,
                            fontSize = 13.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                        )
                    }
                }
            }
        }

        if (isCustom) {
            // Custom mode: width/height/DPI input
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
                    val d = customDpi.toDoubleOrNull() ?: 300.0
                    val pxW = (w / 25.4 * d).toInt()
                    val pxH = (h / 25.4 * d).toInt()
                    vm.flow.selectedDoc = DocSpec(
                        id = "custom",
                        type = "custom",
                        names = mapOf("ko" to "커스텀", "en" to "Custom", "ja" to "カスタム"),
                        size = "${w.toInt()} x ${h.toInt()} mm",
                        px = "$pxW x $pxH px",
                        group = "A",
                        headHeight = "---",
                        standard = "Custom",
                        docDpi = d,
                    )
                    vm.flow.selectedCountry = null
                    onDocSelected()
                },
            )
        } else {
            // Search bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text(tr("search", lang), color = V1.dim) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = V1.text,
                    unfocusedTextColor = V1.text,
                    focusedBorderColor = V1.accent,
                    unfocusedBorderColor = V1.border,
                    cursorColor = V1.accent,
                    focusedContainerColor = V1.card,
                    unfocusedContainerColor = V1.card,
                ),
                singleLine = true,
            )

            if (showDocPicker && selectedCountry != null) {
                // Show doc list for selected country
                DocPickerSection(
                    country = selectedCountry!!,
                    lang = lang,
                    purpose = vm.flow.purpose,
                    onDocSelected = { doc ->
                        vm.flow.selectedCountry = selectedCountry
                        vm.flow.selectedDoc = doc
                        onDocSelected()
                    },
                    onBack = {
                        showDocPicker = false
                        selectedCountry = null
                    },
                )
            } else {
                // Continent grid + country lists
                val filteredGroups = if (searchQuery.isBlank()) {
                    groups
                } else {
                    val q = searchQuery.lowercase()
                    groups.mapNotNull { group ->
                        val filtered = group.countries.filter { c ->
                            c.name(lang).lowercase().contains(q) ||
                            c.name("en").lowercase().contains(q) ||
                            c.id.contains(q)
                        }
                        if (filtered.isEmpty()) null
                        else group.copy(countries = filtered)
                    }
                }

                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(bottom = 32.dp),
                ) {
                    // Continent cards (grid when no search, or list when searching)
                    if (searchQuery.isBlank()) {
                        item {
                            ContinentGrid(
                                groups = filteredGroups,
                                lang = lang,
                                onContinentClick = { id ->
                                    expandedContinent = if (expandedContinent == id) null else id
                                },
                            )
                        }
                    }

                    // Expanded country list or search results
                    val displayGroups = if (searchQuery.isNotBlank()) {
                        filteredGroups
                    } else {
                        filteredGroups.filter { it.id == expandedContinent }
                    }

                    displayGroups.forEach { group ->
                        item {
                            Text(
                                text = group.name(lang),
                                color = V1.accent,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                            )
                        }
                        items(group.countries) { country ->
                            CountryRow(
                                country = country,
                                lang = lang,
                                onClick = {
                                    selectedCountry = country
                                    showDocPicker = true
                                },
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ContinentGrid(
    groups: List<ContinentGroup>,
    lang: String,
    onContinentClick: (String) -> Unit,
) {
    val context = LocalContext.current

    LazyVerticalGrid(
        columns = GridCells.Fixed(3),
        modifier = Modifier
            .fillMaxWidth()
            .height(280.dp)
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(vertical = 8.dp),
    ) {
        items(groups) { group ->
            val meta = continentMeta[group.id]
            val bitmap = remember(group.image) {
                try {
                    context.assets.open("images/${group.image}.jpg").use {
                        BitmapFactory.decodeStream(it)
                    }
                } catch (_: Exception) {
                    null
                }
            }

            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(0.9f)
                    .clip(RoundedCornerShape(12.dp))
                    .clickable { onContinentClick(group.id) },
                shape = RoundedCornerShape(12.dp),
                color = V1.card,
            ) {
                Box(Modifier.fillMaxSize()) {
                    bitmap?.let { bmp ->
                        Image(
                            bitmap = bmp.asImageBitmap(),
                            contentDescription = group.name(lang),
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize(),
                        )
                    }
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.verticalGradient(
                                    colors = listOf(
                                        Color.Transparent,
                                        V1.bg.copy(alpha = 0.8f),
                                    ),
                                    startY = 50f,
                                )
                            )
                    )
                    Column(
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(bottom = 8.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Text(
                            text = meta?.icon ?: "",
                            fontSize = 20.sp,
                        )
                        Text(
                            text = group.name(lang),
                            color = V1.text,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            textAlign = TextAlign.Center,
                        )
                        Text(
                            text = "${group.countries.size}",
                            color = V1.dim,
                            fontSize = 10.sp,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CountryRow(
    country: Country,
    lang: String,
    onClick: () -> Unit,
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 16.dp, vertical = 2.dp),
        color = Color.Transparent,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(text = country.flag, fontSize = 22.sp)
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = country.name(lang),
                    color = V1.text,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Medium,
                )
                if (lang != "en") {
                    Text(
                        text = country.name("en"),
                        color = V1.dim,
                        fontSize = 12.sp,
                    )
                }
            }
            Text(
                text = "${country.docs.size}",
                color = V1.muted,
                fontSize = 13.sp,
            )
        }
    }
    HorizontalDivider(color = V1.border.copy(alpha = 0.3f), thickness = 0.5.dp)
}

@Composable
private fun DocPickerSection(
    country: Country,
    lang: String,
    purpose: String,
    onDocSelected: (DocSpec) -> Unit,
    onBack: () -> Unit,
) {
    val filteredDocs = if (purpose == "custom") {
        country.docs
    } else {
        val matching = country.docs.filter { it.type == purpose }
        matching.ifEmpty { country.docs }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
    ) {
        // Country header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = "<",
                color = V1.muted,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier
                    .clickable { onBack() }
                    .padding(end = 12.dp),
            )
            Text(text = country.flag, fontSize = 28.sp)
            Spacer(Modifier.width(12.dp))
            Text(
                text = country.name(lang),
                color = V1.text,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
            )
        }

        HorizontalDivider(color = V1.border, thickness = 0.5.dp)

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(vertical = 8.dp),
        ) {
            items(filteredDocs) { doc ->
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .clickable { onDocSelected(doc) },
                    shape = RoundedCornerShape(12.dp),
                    color = V1.card,
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = doc.name(lang),
                                color = V1.text,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.weight(1f),
                            )
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = V1.accent.copy(alpha = 0.15f),
                            ) {
                                Text(
                                    text = doc.size,
                                    color = V1.accent,
                                    fontSize = 11.sp,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                )
                            }
                        }
                        Spacer(Modifier.height(4.dp))
                        Row {
                            Text(
                                text = doc.px,
                                color = V1.dim,
                                fontSize = 12.sp,
                            )
                            Spacer(Modifier.width(12.dp))
                            Text(
                                text = doc.standard,
                                color = V1.dim,
                                fontSize = 12.sp,
                            )
                        }
                        if (doc.headHeight != "---" && doc.headHeight != "—") {
                            Text(
                                text = "${tr("face_note", lang)}: ${doc.headHeight}",
                                color = V1.muted,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(top = 4.dp),
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun CustomInputSection(
    customW: String,
    customH: String,
    customDpi: String,
    onWChange: (String) -> Unit,
    onHChange: (String) -> Unit,
    onDpiChange: (String) -> Unit,
    lang: String,
    onConfirm: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = tr("custom", lang),
            color = V1.text,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
        )
        Spacer(Modifier.height(24.dp))

        val fieldColors = OutlinedTextFieldDefaults.colors(
            focusedTextColor = V1.text,
            unfocusedTextColor = V1.text,
            focusedBorderColor = V1.accent,
            unfocusedBorderColor = V1.border,
            cursorColor = V1.accent,
            focusedContainerColor = V1.card,
            unfocusedContainerColor = V1.card,
            focusedLabelColor = V1.accent,
            unfocusedLabelColor = V1.muted,
        )

        OutlinedTextField(
            value = customW,
            onValueChange = onWChange,
            label = { Text(tr("custom_w", lang)) },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = fieldColors,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            singleLine = true,
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = customH,
            onValueChange = onHChange,
            label = { Text(tr("custom_h", lang)) },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = fieldColors,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            singleLine = true,
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = customDpi,
            onValueChange = onDpiChange,
            label = { Text(tr("custom_dpi", lang)) },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = fieldColors,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            singleLine = true,
        )

        Spacer(Modifier.height(32.dp))

        AccentButton(
            text = tr("next", lang),
            onClick = onConfirm,
        )
    }
}
