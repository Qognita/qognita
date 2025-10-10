# Tokenomics Charts Feature

## Overview
Interactive tokenomics visualization system that generates comprehensive charts directly in the chat interface when users ask Qognita to create tokenomics.

## How It Works

### User Experience
1. User opens the chat interface (FloatingChat or SidebarChat)
2. User types: **"Generate tokenomics for [ProjectName]"**
3. Qognita generates AI-powered tokenomics using Morpheus
4. Interactive charts appear directly in the chat message

### Example Queries
- "Generate tokenomics for SolanaAI"
- "Create tokenomics for my DeFi project"
- "Show me tokenomics for GameToken"
- "Design tokenomics for NFT marketplace"

## Features

### 📊 Four Interactive Charts

1. **Distribution Pie Chart**
   - Visual breakdown of token allocation
   - Shows percentages and amounts for each category
   - Color-coded categories with detailed descriptions
   - Vesting schedule information

2. **Vesting Timeline (Line Chart)**
   - 48-month token release schedule
   - Multiple lines for each allocation category
   - Shows gradual token unlock over time
   - Helps prevent market dumps

3. **Staking Rewards (Bar Chart)**
   - Compares APY for different lock periods
   - Shows daily and monthly rates
   - Interactive tier cards with details
   - Encourages long-term holding

4. **Burn Projection (Area Chart)**
   - Token supply reduction over 8 quarters
   - Shows total supply, circulating supply, and burned tokens
   - Visualizes deflationary mechanics
   - Includes burn rate statistics

### 🎨 UI Features
- **Collapsible Design**: Charts can be expanded/collapsed to save space
- **Tabbed Interface**: Switch between different chart views
- **Responsive**: Works on all screen sizes
- **Dark Mode**: Full dark mode support
- **Interactive Tooltips**: Hover for detailed information

### 🤖 AI-Powered Generation
- Uses **Morpheus AI** to generate optimal tokenomics
- Analyzes project details and suggests best practices
- Provides risk analysis and recommendations
- Includes governance and utility suggestions

## Technical Implementation

### Components Created
```
src/components/tokenomics/
├── DistributionChart.tsx      # Pie chart for allocation
├── VestingTimeline.tsx        # Line chart for vesting
├── StakingRewards.tsx         # Bar chart for staking
├── BurnProjection.tsx         # Area chart for burns
└── TokenomicsVisualization.tsx # Main container

src/components/chat/
└── TokenomicsMessage.tsx      # Chat message wrapper
```

### Service Updates
```typescript
// Enhanced tokenomics service
src/services/tokenomics-tools.ts
- Added chart data generation
- Added TypeScript interfaces
- Parses vesting schedules
- Calculates burn projections
```

### Chat Integration
```typescript
// Updated chat interface
src/components/forms/ChatInterface.tsx
- Detects tokenomics requests
- Calls generateTokenomics()
- Renders TokenomicsMessage component
- Extracts project name from query
```

## Data Flow

```
User Query
    ↓
ChatInterface detects "tokenomics"
    ↓
generateTokenomics() called with project details
    ↓
Morpheus AI generates tokenomics structure
    ↓
generateChartData() creates chart-ready data
    ↓
TokenomicsMessage renders in chat
    ↓
User interacts with charts
```

## Chart Data Structure

```typescript
interface TokenomicsChartData {
  distribution: TokenDistribution[]      // Pie chart data
  vestingTimeline: VestingDataPoint[]   // Line chart data
  stakingTiers: StakingTier[]           // Bar chart data
  burnProjections: BurnProjection[]     // Area chart data
}
```

## Customization

### Adding New Chart Types
1. Create new component in `src/components/tokenomics/`
2. Add data interface to `tokenomics-tools.ts`
3. Update `generateChartData()` function
4. Add new tab to `TokenomicsVisualization.tsx`

### Modifying AI Generation
Edit `src/services/tokenomics-tools.ts`:
- Update Morpheus prompt for different suggestions
- Modify fallback tokenomics structure
- Adjust vesting schedule calculations
- Change burn rate projections

## Dependencies

### Required Packages
- `recharts` - Chart library
- `openai` - For Morpheus AI integration
- `lucide-react` - Icons
- `@radix-ui/react-tabs` - Tab component

### Already Installed
All dependencies are already installed and configured.

## Usage Examples

### Basic Usage
```typescript
// In chat, user types:
"Generate tokenomics for SolanaAI"

// Result: Full tokenomics with 4 interactive charts
```

### Advanced Usage
```typescript
// For more detailed generation, modify the query:
"Create tokenomics for my DeFi lending platform with 1 billion supply"

// The system will extract:
// - Project name: "DeFi lending platform"
// - Total supply: 1,000,000,000
```

## Future Enhancements

### Potential Additions
1. **Export Charts**: Download as PNG/PDF
2. **Share Tokenomics**: Generate shareable links
3. **Compare Tokenomics**: Side-by-side comparison
4. **Historical Data**: Show actual vs projected
5. **Custom Parameters**: Let users specify allocation percentages
6. **Token Calculator**: Calculate holdings value over time

### API Integration
Could add endpoints:
- `POST /api/tokenomics/generate` - Generate tokenomics
- `GET /api/tokenomics/:id` - Retrieve saved tokenomics
- `POST /api/tokenomics/export` - Export to various formats

## Testing

### Test Queries
Try these in the chat:
1. "Generate tokenomics for TestProject"
2. "Create tokenomics for my NFT marketplace"
3. "Show me tokenomics for GameFi platform"
4. "Design tokenomics for DAO governance token"

### Expected Behavior
- Charts should render within 2-3 seconds
- All 4 chart types should be visible in tabs
- Data should be consistent across charts
- Tooltips should show on hover
- Charts should be responsive

## Troubleshooting

### Charts Not Showing
- Check if Recharts is installed: `npm list recharts`
- Verify Morpheus API key is set in `.env.local`
- Check browser console for errors

### Morpheus API Errors
- Fallback tokenomics will be used automatically
- Check `MORPHEUS_API_KEY` and `MORPHEUS_API_URL` env vars
- Verify API quota/limits

### Performance Issues
- Charts are optimized for 48 data points (vesting)
- Consider reducing data points for slower devices
- Use React.memo for chart components if needed

## Summary

✅ **Complete Integration**: Charts appear directly in chat  
✅ **AI-Powered**: Uses Morpheus for intelligent generation  
✅ **Interactive**: Full Recharts functionality  
✅ **Responsive**: Works on all devices  
✅ **Expandable**: Easy to add new chart types  

Users can now simply ask Qognita to generate tokenomics and get beautiful, interactive charts instantly!
