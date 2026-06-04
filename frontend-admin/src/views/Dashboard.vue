<template>
  <div class="dashboard-page">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: #e6f7ff;">
            <el-icon size="24" color="#1890ff"><Folder /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats?.totalProjects || 0 }}</div>
            <div class="stat-label">项目总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: #f6ffed;">
            <el-icon size="24" color="#52c41a"><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats?.totalUsers || 0 }}</div>
            <div class="stat-label">用户总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: #fff7e6;">
            <el-icon size="24" color="#fa8c16"><Cpu /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats?.activeEngines || 0 }}/{{ stats?.totalEngines || 0 }}</div>
            <div class="stat-label">引擎状态</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: #f9f0ff;">
            <el-icon size="24" color="#722ed1"><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats?.todayTasks || 0 }}</div>
            <div class="stat-label">今日任务</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>项目趋势</span>
              <el-radio-group v-model="timeRange" size="small">
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <v-chart class="chart" :option="trendOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>平台分布</span>
            </div>
          </template>
          <v-chart class="chart pie-chart" :option="pieOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <!-- 告警列表 -->
    <el-card shadow="hover" class="alert-card">
      <template #header>
        <div class="card-header">
          <span>近期告警</span>
          <el-button link type="primary" size="small">查看全部</el-button>
        </div>
      </template>
      <el-table :data="stats?.recentAlerts || []" style="width: 100%">
        <el-table-column prop="createdAt" label="时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="level" label="级别" width="100">
          <template #default="{ row }">
            <el-tag :type="levelType(row.level)" size="small">{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="150" />
        <el-table-column prop="message" label="告警信息" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import { Folder, User, Cpu, TrendCharts } from '@element-plus/icons-vue'
import { useDashboardStore } from '@/stores/dashboardStore'
import dayjs from 'dayjs'

use([CanvasRenderer, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent])

const dashboardStore = useDashboardStore()
const timeRange = ref('week')
const stats = computed(() => dashboardStore.stats)

const trendOption = computed(() => {
  const trend = stats.value?.weeklyTrend || []
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['新建项目', '构建次数'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trend.map((t) => t.date),
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '新建项目',
        type: 'line',
        smooth: true,
        data: trend.map((t) => t.projects),
        areaStyle: { color: 'rgba(24, 144, 255, 0.1)' },
        itemStyle: { color: '#1890ff' },
      },
      {
        name: '构建次数',
        type: 'line',
        smooth: true,
        data: trend.map((t) => t.builds),
        areaStyle: { color: 'rgba(82, 196, 26, 0.1)' },
        itemStyle: { color: '#52c41a' },
      },
    ],
  }
})

const pieOption = computed(() => {
  const dist = stats.value?.platformDistribution || []
  return {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: '5%', top: 'center' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: dist,
      },
    ],
  }
})

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const levelType = (level: string) => {
  const map: Record<string, string> = {
    info: 'info',
    warning: 'warning',
    error: 'danger',
    critical: 'danger',
  }
  return map[level] || 'info'
}

onMounted(() => {
  dashboardStore.fetchStats()
})
</script>

<style scoped lang="scss">
.dashboard-page {
  .stats-row {
    margin-bottom: 20px;
  }

  .stat-card {
    :deep(.el-card__body) {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: #1a1a2e;
    }

    .stat-label {
      font-size: 13px;
      color: #909399;
      margin-top: 4px;
    }
  }

  .charts-row {
    margin-bottom: 20px;

    .chart {
      height: 320px;
    }

    .pie-chart {
      height: 320px;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 500;
  }

  .alert-card {
    :deep(.el-card__header) {
      padding: 12px 20px;
    }
  }
}
</style>
