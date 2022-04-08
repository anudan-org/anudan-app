import { Component, ElementRef, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
declare var require: any;
import * as $ from "jquery";
const Mark = require('mark.js');

@Component({
  selector: 'app-search-filter',
  templateUrl: './search-filter.component.html',
  styleUrls: ['./search-filter.component.scss']
})
export class SearchFilterComponent implements OnInit, OnChanges {

  currentIndex: number = 0;
  offsetTop: number = 210;
  searchString: string;


  @Input("ready") ready = false;
  @Input("searchContext") searchContext = '.search-context';
  @Input("scollableArea") scrollableArea = '.main-content';
  @Output() filterCriteria = new EventEmitter();
  @Output() highlightDone = new EventEmitter();
  @Output() close = new EventEmitter();

  @ViewChild("searchCompField") searchCompField: ElementRef;


  constructor() {
    //do nothing
  }

  ngOnInit() {
    //do nothing
  }

  ngOnChanges(changes: SimpleChanges) {
    for (let property in changes) {
      if (property === 'ready') {
        this.highlightText(this.searchString);
        this.highlightDone.emit(false);
      }
      this.searchCompField.nativeElement.focus();
    }
  }
  startFilter(val) {
    this.filterCriteria.emit(val);
    this.searchString = val;
  }

  highlightText(val) {
    if (val === undefined) {
      return;
    }
    let ctx = document.querySelectorAll(this.searchContext);
    var instance = new Mark(ctx);

    instance.unmark({
      done: function () {
        instance.mark(val, {
          separateWordSearch: false,
          done: function () {
            this.results = $(ctx).find("mark");
            this.currentIndex = 0;

            if (this.results.length) {
              var position,
                $current = this.results.eq(this.currentIndex);
              this.results.removeClass('current');
              if ($current.length) {
                $current.addClass('current');
                position = $current.offset().top - this.offsetTop;
                window.scrollTo(0, position);
              }
            }
          }
        });
      }
    });
  }

  navgiateToSearch(direction: any) {
    let marks = $('mark');
    if (marks.length > 0) {
      $(marks[this.currentIndex]).removeClass('current');
      this.currentIndex += direction === 'forward' ? 1 : -1;
      if (this.currentIndex === (marks.length)) {
        this.currentIndex = 0;
      }
      if (this.currentIndex === -1) {
        this.currentIndex = marks.length - 1;
      }
      $(marks[this.currentIndex]).addClass('current');

      this.scrollIfNeeded(marks[this.currentIndex], $(this.scrollableArea)[0]);
    }
  }

  scrollIfNeeded(element, container) {
    $(container).animate({ scrollTop: $(container).scrollTop() + ($(element).offset().top - $(container).offset().top) - 100 });
  }

  closeSearch() {
    this.highlightText('');
    this.filterCriteria.emit('');
    this.currentIndex = 0;
    let marks = $('mark');
    $(this.scrollableArea).animate({
      scrollTop: 0
    }, 500);
    this.close.emit(true);
  }
}
