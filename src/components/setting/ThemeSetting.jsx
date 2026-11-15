import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Laptop, Check, Palette, Sparkles, RefreshCw } from 'lucide-react';

const PRESET_COLORS = [
    { name: 'Ocean Blue', value: '#075bb9' },
    { name: 'Electric Indigo', value: '#4f46e5' },
    { name: 'Emerald Green', value: '#059669' },
    { name: 'Royal Violet', value: '#7c3aed' },
    { name: 'Crimson Rose', value: '#e11d48' },
    { name: 'Amber Flame', value: '#d97706' },
    { name: 'Slate Steel', value: '#475569' },
    { name: 'Cyan Teal', value: '#0891b2' }
];

export default function ThemeSetting() {
    const {
        theme,
        buttonColor,
        resolvedTheme,
        isSaving,
        isSynced,
        setTheme,
        setButtonColor,
        saveThemeSettings
    } = useTheme();

    const [customColor, setCustomColor] = useState(buttonColor);
    const [savedNotice, setSavedNotice] = useState(false);

    const handleThemeSelect = (selectedTheme) => {
        setTheme(selectedTheme);
        showSaveFeedback();
    };

    const handleColorSelect = (selectedColor) => {
        setCustomColor(selectedColor);
        setButtonColor(selectedColor);
        showSaveFeedback();
    };

    const handleCustomColorChange = (e) => {
        const val = e.target.value;
        setCustomColor(val);
        if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val)) {
            setButtonColor(val);
            showSaveFeedback();
        }
    };

    const showSaveFeedback = () => {
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2500);
    };

    const handleManualSave = async () => {
        await saveThemeSettings(theme, buttonColor);
        showSaveFeedback();
    };

    return (
        <div className="setting-subtab-container">
            {/* Header / Intro */}
            <div className="setting-section-header">
                <div>
                    <h3 className="setting-section-title">Appearance & Theme</h3>
                    <p className="setting-section-desc">
                        Customize your workspace theme and button colors. Preferences are saved automatically to your profile in the database.
                    </p>
                </div>
                <div className="setting-header-actions">
                    {savedNotice && (
                        <span className="save-badge saved">
                            <Check size={13} /> Saved
                        </span>
                    )}
                    {isSaving && (
                        <span className="save-badge saving">
                            <RefreshCw size={13} className="spin" /> Syncing...
                        </span>
                    )}
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handleManualSave}
                        disabled={isSaving}
                    >
                        Save Appearance
                    </button>
                </div>
            </div>

            {/* 1. Theme Mode Selection */}
            <div className="setting-group">
                <label className="setting-group-label">Theme Mode</label>
                <div className="theme-options-grid">
                    {/* Light Option */}
                    <div
                        className={`theme-card ${theme === 'light' ? 'active' : ''}`}
                        onClick={() => handleThemeSelect('light')}
                        role="button"
                        tabIndex={0}
                    >
                        <div className="theme-preview-box light-preview">
                            <div className="preview-nav light-nav"></div>
                            <div className="preview-content light-content">
                                <div className="preview-line light-line"></div>
                                <div className="preview-line light-line short"></div>
                            </div>
                        </div>
                        <div className="theme-card-info">
                            <Sun size={16} className="theme-icon light-icon" />
                            <div>
                                <span className="theme-title">Light</span>
                                <span className="theme-sub">Clean, high-contrast light mode</span>
                            </div>
                        </div>
                        {theme === 'light' && <div className="theme-check-mark"><Check size={14} /></div>}
                    </div>

                    {/* Dark Option */}
                    <div
                        className={`theme-card ${theme === 'dark' ? 'active' : ''}`}
                        onClick={() => handleThemeSelect('dark')}
                        role="button"
                        tabIndex={0}
                    >
                        <div className="theme-preview-box dark-preview">
                            <div className="preview-nav dark-nav"></div>
                            <div className="preview-content dark-content">
                                <div className="preview-line dark-line"></div>
                                <div className="preview-line dark-line short"></div>
                            </div>
                        </div>
                        <div className="theme-card-info">
                            <Moon size={16} className="theme-icon dark-icon" />
                            <div>
                                <span className="theme-title">Dark</span>
                                <span className="theme-sub">Easy on eyes in low light</span>
                            </div>
                        </div>
                        {theme === 'dark' && <div className="theme-check-mark"><Check size={14} /></div>}
                    </div>

                    {/* System Option */}
                    <div
                        className={`theme-card ${theme === 'system' ? 'active' : ''}`}
                        onClick={() => handleThemeSelect('system')}
                        role="button"
                        tabIndex={0}
                    >
                        <div className="theme-preview-box system-preview">
                            <div className="system-split-light"></div>
                            <div className="system-split-dark"></div>
                        </div>
                        <div className="theme-card-info">
                            <Laptop size={16} className="theme-icon system-icon" />
                            <div>
                                <span className="theme-title">System Default</span>
                                <span className="theme-sub">Auto-sync with OS ({resolvedTheme})</span>
                            </div>
                        </div>
                        {theme === 'system' && <div className="theme-check-mark"><Check size={14} /></div>}
                    </div>
                </div>
            </div>

            {/* 2. Button & Primary Accent Color */}
            <div className="setting-group">
                <div className="setting-group-header-row">
                    <div>
                        <label className="setting-group-label">Button & Accent Color</label>
                        <p className="setting-group-sub">Choose a brand color for buttons, active tabs, and primary action items.</p>
                    </div>
                     
                </div>

                {/* Preset Palettes */}
                <div className="color-palette-grid">
                    {PRESET_COLORS.map((item) => {
                        const isSelected = buttonColor.toLowerCase() === item.value.toLowerCase();
                        return (
                            <button
                                key={item.value}
                                className={`color-swatch-btn ${isSelected ? 'active' : ''}`}
                                onClick={() => handleColorSelect(item.value)}
                                title={item.name}
                                style={{ '--swatch-color': item.value }}
                            >
                                <span className="swatch-circle" style={{ backgroundColor: item.value }}>
                                    {isSelected && <Check size={14} className="swatch-check" />}
                                </span>
                                <span className="swatch-label">{item.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Custom Color Picker */}
                <div className="custom-color-row">
                    <Palette size={16} className="custom-color-icon" />
                    <span className="custom-color-label">Custom Accent:</span>
                    <div className="custom-picker-wrapper">
                        <input
                            type="color"
                            value={buttonColor}
                            onChange={(e) => handleColorSelect(e.target.value)}
                            className="color-input-native"
                            id="customColorPicker"
                        />
                        <label htmlFor="customColorPicker" className="color-picker-trigger" style={{ backgroundColor: buttonColor }} />
                    </div>
                    <input
                        type="text"
                        value={customColor}
                        onChange={handleCustomColorChange}
                        placeholder="#075bb9"
                        className="color-input-text"
                        maxLength={7}
                    />
                </div>
            </div>

            {/* 3. Live Interactive UI Preview */}
            <div className="setting-group">
                <label className="setting-group-label">
                    <Sparkles size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    Live Button & Component Preview
                </label>
                <div className="preview-stage-card">
                    <p className="preview-stage-desc">
                        Below is a live preview of how buttons and active components render with your current theme (<strong>{resolvedTheme}</strong>) and accent color (<strong>{buttonColor}</strong>).
                    </p>

                    <div className="preview-buttons-row">
                        <button className="btn btn-primary">
                            Primary Action
                        </button>
                        <button className="btn btn-outline-primary">
                            Outline Button
                        </button>
                        <button className="btn btn-secondary">
                            Secondary
                        </button>
                        <button className="btn btn-primary btn-sm">
                            Small Action
                        </button>
                        <button className="btn btn-primary" disabled>
                            Disabled
                        </button>
                    </div>

                    <div className="preview-badges-row">
                        <span className="preview-pill-active" style={{ backgroundColor: buttonColor }}>
                            Active Filter
                        </span>
                        <span className="preview-tag-outline" style={{ borderColor: buttonColor, color: buttonColor }}>
                            Status Tag
                        </span>
                        <span className="preview-status-badge">
                            Theme: {resolvedTheme}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
