import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FullCalendarComponent } from './fullcalendar.component';
import dayGridPlugin from '@fullcalendar/daygrid';


describe('FullCalendarComponent', () => {
  let component: FullCalendarComponent;
  let fixture: ComponentFixture<FullCalendarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FullCalendarComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FullCalendarComponent);
    component = fixture.componentInstance;
    component.plugins = [dayGridPlugin];
    fixture.detectChanges(); // necessary for initializing change detection system
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(isHeaderToolbarRendered(fixture)).toBe(true);
  });

  it('should unmount and call destroy', () => {
    fixture.destroy();
    expect(isHeaderToolbarRendered(fixture)).toBe(false);
  });

  it('should expose an API', () => {
    const calendarApi = component.getApi();
    expect(calendarApi).toBeTruthy();

    const newDate = new Date(Date.UTC(2000, 0, 1));
    calendarApi.gotoDate(newDate);
    expect(calendarApi.getDate().valueOf()).toBe(newDate.valueOf());
  });

});


// some tests need a wrapper component

@Component({
  selector: 'full-calendar-test',
  template: `
    <full-calendar
      [plugins]="plugins"
      [header]="{
        left: 'prev,next today myCustomButton',
        center: 'title',
        right: 'dayGridMonth'
      }"
      [weekends]="weekendsEnabled"
      [events]="events"
      (viewSkeletonRender)="handleViewSkeletonRender()"
      (eventRender)="handleEventRender()"
    ></full-calendar>
  `
})
class HostComponent {
  plugins = [dayGridPlugin];
  weekendsEnabled = true;
  height = 400;
  viewSkeletonRenderCnt = 0;
  events: any = [buildEvent()];
  eventRenderCnt = 0;

  disableWeekends() {
    this.weekendsEnabled = false;
  }

  changeHeight() {
    this.height = 500;
  }

  addEventReset() {
    this.events = this.events.concat([ buildEvent() ]);
  }

  setEventFunc(timeout) {
    this.events = function(info, successCallback) {
      setTimeout(function() {
        successCallback([ buildEvent() ]);
      }, timeout);
    };
  }

  handleViewSkeletonRender() {
    this.viewSkeletonRenderCnt++;
  }

  handleEventRender() {
    this.eventRenderCnt++;
  }
}

describe('HostComponent', () => {
  let component: HostComponent;
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FullCalendarComponent, HostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // necessary for initializing change detection system
  }));

  it('should handle prop changes', () => {
    expect(isWeekendsRendered(fixture)).toBe(true);
    component.disableWeekends();
    fixture.detectChanges();
    expect(isWeekendsRendered(fixture)).toBe(false);
  });

  it('should handle prop changes that don\'t rerender any DOM', () => {
    const headerEl = getHeaderToolbarEl(fixture);
    expect(component.viewSkeletonRenderCnt).toBe(1);
    component.changeHeight();
    fixture.detectChanges();
    expect(getHeaderToolbarEl(fixture)).toBe(headerEl);
    expect(component.viewSkeletonRenderCnt).toBe(1);
  });

  it('should emit an event', () => {
    expect(component.viewSkeletonRenderCnt).toBeGreaterThan(0);
  });

  it('should render new events with prop change', () => {
    expect(component.eventRenderCnt).toBe(1);
    component.addEventReset();
    fixture.detectChanges();
    expect(component.eventRenderCnt).toBe(3); // +2 (the two events were freshly rendered)
  });

  it('should handle new events async function', (done) => {
    expect(component.eventRenderCnt).toBe(1);
    component.setEventFunc(100);
    fixture.detectChanges();
    setTimeout(function() {
      expect(component.eventRenderCnt).toBe(3); // +2 (the two events were freshly rendered)
      done();
    }, 200);
  });

});


// some tests need a wrapper component with DEEP COMPARISON

@Component({
  selector: 'full-calendar-test',
  template: `
    <full-calendar
      deepChangeDetection="true"
      [plugins]="plugins"
      [events]="events"
      (eventRender)="handleEventRender()"
    ></full-calendar>
  `
})
class DeepHostComponent {
  plugins = [dayGridPlugin];
  events: any = [buildEvent()];
  eventRenderCnt = 0;

  addEventAppend() {
    this.events.push(buildEvent());
  }

  updateEventTitle(title) {
    this.events[0].title = title;
  }

  setEventFunc(timeout) {
    this.events = function(info, successCallback) {
      setTimeout(function() {
        successCallback([ buildEvent() ]);
      }, timeout);
    };
  }

  handleEventRender() {
    this.eventRenderCnt++;
  }
}

describe('DeepHostComponent', () => {
  let component: DeepHostComponent;
  let fixture: ComponentFixture<DeepHostComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FullCalendarComponent, DeepHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DeepHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // necessary for initializing change detection system
  }));

  it('should render new appended event', () => {
    expect(component.eventRenderCnt).toBe(1);
    component.addEventAppend();
    fixture.detectChanges();
    expect(component.eventRenderCnt).toBe(3); // +2 (the two events were freshly rendered)
  });

  it('should render event mutation', () => {
    expect(component.eventRenderCnt).toBe(1);

    component.updateEventTitle('another title');
    fixture.detectChanges();
    expect(getFirstEventTitle(fixture)).toBe('another title');
    expect(component.eventRenderCnt).toBe(2); // +1

    component.updateEventTitle('another title');
    fixture.detectChanges();
    expect(getFirstEventTitle(fixture)).toBe('another title');
    expect(component.eventRenderCnt).toBe(2); // +0 (didn't rerender anything)
  });

  it('should handle new events async function', (done) => {
    expect(component.eventRenderCnt).toBe(1);
    component.setEventFunc(100);
    fixture.detectChanges();
    setTimeout(function() {
      expect(component.eventRenderCnt).toBe(3); // +2 (the two events were freshly rendered)
      done();
    }, 200);
  });

});


// FullCalendar data utils

function buildEvent() {
  return  { title: 'event', start: new Date() };
}


// DOM utils

function isHeaderToolbarRendered(fixture) {
  return Boolean(getHeaderToolbarEl(fixture));
}

function getHeaderToolbarEl(fixture) {
  return fixture.nativeElement.querySelector('.fc-header-toolbar');
}

function isWeekendsRendered(fixture) {
  return Boolean(fixture.nativeElement.querySelector('.fc-sat'));
}

function getFirstEventTitle(fixture) {
  return fixture.nativeElement.querySelector('.fc-event .fc-title').innerText;
}
