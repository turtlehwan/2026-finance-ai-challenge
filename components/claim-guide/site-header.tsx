"use client"

import { ArrowRightIcon, MenuIcon, ShieldCheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"

const navItems = [
  { href: "#demo", label: "사례 체험" },
  { href: "#official-channels", label: "공식 확인" },
  { href: "#trust", label: "신뢰 기준" },
]

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="보험금 길잡이 Agent 홈">
      <span className="brand-icon" aria-hidden="true">
        <ShieldCheckIcon />
      </span>
      <span>보험금 길잡이 Agent</span>
    </a>
  )
}

function TextSizeControl({
  largeText,
  onChange,
}: {
  largeText: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="text-size-control">
      <span aria-hidden="true">가</span>
      <strong>큰글씨</strong>
      <Switch
        checked={largeText}
        onCheckedChange={onChange}
        aria-label="큰글씨 모드"
      />
    </label>
  )
}

export function SiteHeader({
  largeText,
  onTextSizeChange,
}: {
  largeText: boolean
  onTextSizeChange: (checked: boolean) => void
}) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <TextSizeControl largeText={largeText} onChange={onTextSizeChange} />
          <Sheet>
            <SheetTrigger asChild>
              <Button
                className="mobile-menu-trigger"
                variant="outline"
                size="icon-lg"
                aria-label="메뉴 열기"
              >
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>보험금 길잡이 Agent</SheetTitle>
                <SheetDescription>
                  합성 사례 분석과 신뢰 원칙을 확인하세요.
                </SheetDescription>
              </SheetHeader>
              <nav className="mobile-nav" aria-label="모바일 메뉴">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <a href={item.href}>
                      {item.label}
                      <ArrowRightIcon aria-hidden="true" />
                    </a>
                  </SheetClose>
                ))}
              </nav>
              <div className="mobile-text-control">
                <TextSizeControl
                  largeText={largeText}
                  onChange={onTextSizeChange}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
